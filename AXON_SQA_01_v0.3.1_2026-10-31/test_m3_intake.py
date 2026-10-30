import copy
import hashlib
from pathlib import Path
import tempfile
import unittest

from m3_intake import ARTIFACT_ROLES, SYNTH_ROLES, check_submission
from evidence_gate import assess, checked_artifact


class M3IntakeTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        data = b"Synthetic completeness fixture. No RTL synthesis or hardware measurement.\n"
        (self.root / "fixture.txt").write_bytes(data)
        artifact = {"path": "fixture.txt", "sha256": hashlib.sha256(data).hexdigest()}
        commit = "a" * 40
        run = {"source_commit": commit, "command": "fixture only", "tool_version": "fixture", "exit_code": 0, "cases_run": 1}
        self.item = {"id": "synthetic", "repository": "fixture/repo", "source_commit": commit,
                     "worktree_clean": True, "source_snapshot": artifact,
                     "contract": {"code_name": "fixture", "n_data": 5, "k_logical": 1, "distance": 3,
                                  "rounds": 1, "syndrome_bits": 4, "output_bits": 10, "measurement_errors": False,
                                  "error_model": "fixture only", "syndrome_layout": "fixture",
                                  "input_encoding": "fixture", "output_semantics": "fixture"},
                     "artifacts": {role: dict(artifact) for role in ARTIFACT_ROLES},
                     "rtl_test": dict(run), "rust_test": dict(run),
                     "crosscheck": {**run, "comparison_boundary": "declared_contract_only", "mismatches": 0},
                     "synthesis_runs": [{"id": "fixture", "source_commit": commit,
                         "top": "fixture", "target": "fixture", "tool_version": "fixture",
                         "command": "fixture", "mapping_stage": "fixture", "hierarchy_scope": "fixture",
                         "exit_code": 0, "artifacts": {role: dict(artifact) for role in SYNTH_ROLES},
                         "metrics": [{"raw_field": "fixture.cells", "value": 1, "unit": "cells", "log_line": 1}]}]}

    def check(self):
        return check_submission({"schema_version": "m3-intake-1", "implementations": [self.item]}, self.root)

    def test_complete_fixture_only_ready_for_human_review(self):
        result = self.check()
        self.assertTrue(result["report_complete_for_review"])
        self.assertEqual(result["hardware_validation"], "NOT_EVALUATED")
        self.assertEqual(result["implementations"][0]["semantic_equivalence"], "NOT_AUTHENTICATED")

    def test_short_sha_or_dirty_tree_blocks(self):
        self.item["source_commit"] = "ef5ceff"
        self.assertFalse(self.check()["report_complete_for_review"])
        self.item["source_commit"] = "a" * 40
        self.item["worktree_clean"] = False
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_different_commit_test_or_synthesis_blocks(self):
        for field in ("rust_test", "rtl_test", "crosscheck"):
            self.item[field]["source_commit"] = "b" * 40
            self.assertFalse(self.check()["report_complete_for_review"])
            self.item[field]["source_commit"] = "a" * 40
        self.item["synthesis_runs"][0]["source_commit"] = "b" * 40
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_missing_contract_or_different_output_boundary_blocks(self):
        self.item["contract"]["syndrome_layout"] = None
        self.assertFalse(self.check()["report_complete_for_review"])
        self.item["contract"]["syndrome_layout"] = "fixture"
        self.item["crosscheck"]["comparison_boundary"] = "all QEC"
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_failed_command_or_nonzero_mismatches_blocks(self):
        self.item["rtl_test"]["exit_code"] = 1
        self.assertFalse(self.check()["report_complete_for_review"])
        self.item["rtl_test"]["exit_code"] = 0
        self.item["crosscheck"]["mismatches"] = 1
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_hash_change_blocks(self):
        (self.root / "fixture.txt").write_text("changed", encoding="utf-8")
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_metric_units_do_not_turn_logic_depth_into_ns(self):
        self.item["synthesis_runs"][0]["metrics"][0]["unit"] = "ns"
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_two_code_contracts_remain_separate(self):
        other = copy.deepcopy(self.item)
        other["id"] = "different_code"
        other["contract"].update(n_data=3, distance=1)
        result = check_submission({"schema_version": "m3-intake-1", "implementations": [self.item, other]}, self.root)
        self.assertEqual(len(result["implementations"]), 2)
        self.assertTrue(result["report_complete_for_review"])
        other["id"] = self.item["id"]
        self.assertFalse(check_submission({"schema_version": "m3-intake-1", "implementations": [self.item, other]}, self.root)["report_complete_for_review"])

    def test_boolean_and_fractional_counts_block(self):
        for value in (True, 1.5, 0):
            self.item["rtl_test"]["cases_run"] = value
            self.assertFalse(self.check()["report_complete_for_review"])
        self.item["rtl_test"]["cases_run"] = 1
        self.item["crosscheck"]["mismatches"] = False
        self.assertFalse(self.check()["report_complete_for_review"])

    def test_unfilled_template_blocks(self):
        import json
        template = json.loads((Path(__file__).parent / "submissions/m3_evidence_template.json").read_text(encoding="utf-8"))
        self.assertFalse(check_submission(template, self.root)["report_complete_for_review"])

    def test_invalid_schema_rejected(self):
        with self.assertRaises(ValueError):
            check_submission({"schema_version": "wrong", "implementations": [self.item]}, self.root)


class EvidenceHardeningTests(unittest.TestCase):
    def test_windows_escape_paths_rejected_on_all_hosts(self):
        for path in ("C:/raw.log", "C:raw.log", "..\\raw.log"):
            self.assertIsNotNone(checked_artifact({"path": path, "sha256": "0" * 64}, Path.cwd()))

    def test_zero_mul_boolean_counts_cannot_count_as_zero(self):
        claim = {"id": "fixture", "kind": "zero_multiplier", "value": 0,
                 "metadata": {"tool_version": "fixture", "target": "fixture", "top": "fixture",
                              "command": "fixture", "pre_mapping_mul_count": False, "mapped_dsp_count": False,
                              "structural_review": "multiplier_free_for_declared_domain"}}
        result = assess(claim, Path.cwd())
        self.assertTrue(any("counts must both be zero" in issue for issue in result["issues"]))

    def test_whitespace_metadata_is_missing(self):
        claim = {"id": "fixture", "kind": "resource_count", "value": 1,
                 "metadata": {k: " " for k in ("tool_version", "target", "top", "command", "mapping_stage")}}
        self.assertIn("missing metadata: top", assess(claim, Path.cwd())["issues"])
