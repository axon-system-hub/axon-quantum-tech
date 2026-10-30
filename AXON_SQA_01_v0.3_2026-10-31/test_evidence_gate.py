import copy
import hashlib
from pathlib import Path
import tempfile
import unittest

from evidence_gate import assess, checked_artifact, evaluate_report


class EvidenceGateChecks(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "raw.log").write_bytes(b"Synthetic fixture; NOT a hardware measurement.\n")
        self.claim = {"id": "fixture", "kind": "resource_count", "value": 20,
                      "metadata": {k: "synthetic fixture" for k in ("tool_version", "target", "top", "command", "mapping_stage")},
                      "artifacts": [{"path": "raw.log", "sha256": hashlib.sha256((self.root / "raw.log").read_bytes()).hexdigest()}]}

    def test_complete_fixture_is_reviewable_not_hardware_verified(self):
        result = assess(self.claim, self.root)
        self.assertEqual(result["status"], "READY_FOR_REVIEW")
        self.assertEqual(result["hardware_authentication"], "NOT_PERFORMED")

    def test_missing_artifacts_blocks(self):
        self.claim["artifacts"] = []
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_tampered_log_blocks(self):
        (self.root / "raw.log").write_text("changed", encoding="utf-8")
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_missing_log_blocks(self):
        (self.root / "raw.log").unlink()
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_path_traversal_and_absolute_paths_rejected(self):
        for path in ("../raw.log", str(self.root / "raw.log")):
            artifact = {**self.claim["artifacts"][0], "path": path}
            self.assertIsNotNone(checked_artifact(artifact, self.root))

    def test_unknown_value_not_zero(self):
        self.claim["value"] = None
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_boolean_and_nan_rejected(self):
        for value in (True, float("nan"), float("inf"), -1):
            self.claim["value"] = value
            self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_ltp_cannot_be_latency_evidence(self):
        self.claim.update(kind="latency", value=.5,
                          metadata={"method": "ltp_only", "start_event": "input", "end_event": "output", "operating_conditions": "none"})
        self.assertEqual(assess(self.claim, self.root)["status"], "CONTRADICTED")

    def test_sta_without_corner_and_constraints_blocks(self):
        self.claim.update(kind="latency", value=.5,
                          metadata={"method": "sta", "start_event": "input", "end_event": "output", "operating_conditions": "fixture"})
        result = assess(self.claim, self.root)
        self.assertEqual(result["status"], "BLOCKED")
        self.assertIn("missing STA metadata: library_corner", result["issues"])

    def test_zero_mul_without_pre_mapping_and_review_blocks(self):
        self.claim.update(kind="zero_multiplier", value=0)
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_zero_power_inference_rejected(self):
        self.claim.update(kind="zero_power", value=0)
        self.assertEqual(assess(self.claim, self.root)["status"], "CONTRADICTED")

    def test_qec_without_code_and_noise_model_blocks(self):
        self.claim.update(kind="qec_e2e", value=5)
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")

    def test_duplicate_claim_ids_rejected(self):
        with self.assertRaises(ValueError):
            evaluate_report({"schema_version": "0.3", "claims": [self.claim, copy.deepcopy(self.claim)]}, self.root)

    def test_empty_report_rejected(self):
        with self.assertRaises(ValueError):
            evaluate_report({"schema_version": "0.3", "claims": []}, self.root)

    def test_integer_resources_required(self):
        self.claim["value"] = 20.5
        self.assertEqual(assess(self.claim, self.root)["status"], "BLOCKED")


if __name__ == "__main__":
    unittest.main()
