"""Check source-linked M3 submissions for review completeness, never hardware PASS.

No external commands are executed. Input JSON and relative evidence files only.
Each implementation must keep its code contract and synthesis runs separate.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re

from evidence_gate import checked_artifact

CONTRACT_TEXT = ("code_name", "error_model", "syndrome_layout", "input_encoding", "output_semantics")
ARTIFACT_ROLES = ("rtl_source", "testbench_source", "rust_reference_source", "golden_vectors",
                  "rtl_test_log", "rust_test_log", "crosscheck_log")
SYNTH_ROLES = ("script", "log", "pre_map_netlist", "mapped_netlist")


def integer(value, minimum=0):
    return type(value) is int and value >= minimum


def text(value):
    return isinstance(value, str) and bool(value.strip())


def check_submission(report, root):
    issues, results, ids = [], [], set()
    if not isinstance(report, dict) or report.get("schema_version") != "m3-intake-1":
        raise ValueError("schema_version must be m3-intake-1")
    implementations = report.get("implementations")
    if not isinstance(implementations, list) or not implementations:
        raise ValueError("nonempty implementations list required")
    for item in implementations:
        errors = []
        if not isinstance(item, dict):
            results.append({"id": None, "status": "BLOCKED", "issues": ["implementation must be an object"]})
            continue
        ident, commit = item.get("id"), item.get("source_commit")
        if not text(ident) or ident in ids:
            errors.append("implementation id must be nonempty and unique")
        if isinstance(ident, str):
            ids.add(ident)
        if not text(item.get("repository")):
            errors.append("repository required")
        if not isinstance(commit, str) or not re.fullmatch(r"[0-9a-fA-F]{40}", commit):
            errors.append("full 40-hex source commit required")
        # A dirty tree can be submitted separately, but cannot be attributed to a commit here.
        if item.get("worktree_clean") is not True:
            errors.append("clean worktree source attribution required")
        contract = item.get("contract", {})
        if not isinstance(contract, dict):
            contract = {}
        for field in CONTRACT_TEXT:
            if not text(contract.get(field)):
                errors.append(f"contract.{field} required")
        for field in ("n_data", "k_logical", "distance", "rounds", "syndrome_bits", "output_bits"):
            if not integer(contract.get(field), 1):
                errors.append(f"contract.{field} must be a positive integer")
        if all(integer(contract.get(f), 1) for f in ("n_data", "k_logical", "distance")):
            if contract["k_logical"] > contract["n_data"] or contract["distance"] > contract["n_data"]:
                errors.append("invalid declared n/k/d bounds")
        if type(contract.get("measurement_errors")) is not bool:
            errors.append("contract.measurement_errors boolean required")

        def artifact(value, label):
            problem = checked_artifact(value, root)
            if problem:
                errors.append(label + ": " + problem)

        artifact(item.get("source_snapshot"), "source_snapshot")
        artifacts = item.get("artifacts", {})
        if not isinstance(artifacts, dict):
            artifacts = {}
        for role in ARTIFACT_ROLES:
            artifact(artifacts.get(role), role)
        for role in ("rtl_test", "rust_test", "crosscheck"):
            run = item.get(role, {})
            if not isinstance(run, dict):
                run = {}
            for field in ("command", "tool_version"):
                if not text(run.get(field)):
                    errors.append(f"{role}.{field} required")
            if run.get("source_commit") != commit:
                errors.append(f"{role}.source_commit mismatch")
            if type(run.get("exit_code")) is not int or run["exit_code"] != 0:
                errors.append(f"{role}.exit_code must be integer zero")
            if not integer(run.get("cases_run"), 1):
                errors.append(f"{role}.cases_run must be positive integer")
        cross = item.get("crosscheck", {})
        if not isinstance(cross, dict):
            cross = {}
        if cross.get("comparison_boundary") != "declared_contract_only":
            errors.append("crosscheck boundary must be declared_contract_only")
        if type(cross.get("mismatches")) is not int or cross["mismatches"] != 0:
            errors.append("crosscheck.mismatches must be integer zero")
        syntheses = item.get("synthesis_runs")
        if not isinstance(syntheses, list) or not syntheses:
            errors.append("at least one separate synthesis run required")
            syntheses = []
        run_ids = set()
        for run in syntheses:
            if not isinstance(run, dict):
                errors.append("synthesis run must be an object")
                continue
            sid = run.get("id")
            if not text(sid) or sid in run_ids:
                errors.append("synthesis run id must be nonempty and unique")
            if isinstance(sid, str):
                run_ids.add(sid)
            for field in ("top", "tool_version", "target", "command", "mapping_stage", "hierarchy_scope"):
                if not text(run.get(field)):
                    errors.append(f"synthesis.{field} required")
            if run.get("source_commit") != commit:
                errors.append("synthesis.source_commit mismatch")
            if type(run.get("exit_code")) is not int or run["exit_code"] != 0:
                errors.append("synthesis.exit_code must be integer zero")
            raw = run.get("artifacts", {})
            if not isinstance(raw, dict):
                raw = {}
            for role in SYNTH_ROLES:
                artifact(raw.get(role), "synthesis." + role)
            metrics = run.get("metrics")
            if not isinstance(metrics, list) or not metrics:
                errors.append("separate synthesis metrics required")
                continue
            fields = set()
            for metric in metrics:
                if not isinstance(metric, dict):
                    errors.append("metric must be an object")
                    continue
                field = metric.get("raw_field")
                if not text(field) or field in fields:
                    errors.append("metric raw_field must be nonempty and unique in its run")
                if isinstance(field, str):
                    fields.add(field)
                if metric.get("unit") not in {"cells", "LUT4", "DSP", "logic_levels", "operators"}:
                    errors.append("unsupported structural metric unit; timing needs separate evidence_gate report")
                if not integer(metric.get("value")):
                    errors.append("structural metric value must be a nonnegative integer")
                if not integer(metric.get("log_line"), 1):
                    errors.append("metric log_line must be positive integer")
        results.append({"id": ident, "status": "BLOCKED" if errors else "READY_FOR_REVIEW",
                        "issues": errors, "semantic_equivalence": "NOT_AUTHENTICATED"})
    ready = not issues and all(x["status"] == "READY_FOR_REVIEW" for x in results)
    return {"schema_version": "m3-intake-1", "report_complete_for_review": ready,
            "implementations": results, "hardware_validation": "NOT_EVALUATED",
            "note": "Metadata and file hashes only. Commit attribution, log meaning, equivalence and measurements require independent review."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path)
    parser.add_argument("--root", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = check_submission(json.loads(args.report.read_text(encoding="utf-8")), args.root or args.report.parent)
    except (OSError, ValueError, TypeError) as exc:
        parser.exit(2, f"Invalid M3 submission: {exc}\n")
    rendered = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0 if result["report_complete_for_review"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
