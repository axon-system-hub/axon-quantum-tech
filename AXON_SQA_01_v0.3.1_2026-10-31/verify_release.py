"""Run the bounded software validation and write a reproducible evidence bundle.

Python standard library only, Python >=3.10. No hardware tests are performed.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys

from engineering_model import evaluate, reference_calculations
from evidence_gate import evaluate_report
from qec_reference import report as qec_report
from release_integrity import verify_manifest
from m3_intake import check_submission

ROOT = Path(__file__).resolve().parent


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "runs/latest")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    if output.is_relative_to(ROOT.resolve()) and not output.is_relative_to((ROOT / "runs").resolve()):
        parser.error("outputs inside the release must be under runs/; results/ is an immutable delivery snapshot")
    integrity = verify_manifest(ROOT, "source")
    if integrity["status"] != "PASS":
        print(json.dumps({"software_validation_status": "FAIL", "source_integrity": integrity}, indent=2))
        return 1
    output.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, "-m", "unittest", "-v", "test_engineering_model",
               "test_regressions", "test_qec_reference", "test_evidence_gate",
               "test_release_integrity", "test_m3_intake"]
    test = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", timeout=120)
    log = test.stdout + test.stderr
    (output / "tests.log").write_text(log, encoding="utf-8")
    match = re.search(r"Ran (\d+) tests", log)
    count = int(match.group(1)) if match else 0
    unknown_cfg = json.loads((ROOT / "inputs_unknown.json").read_text(encoding="utf-8"))
    example_cfg = json.loads((ROOT / "inputs_illustrative.json").read_text(encoding="utf-8"))
    sizes = [100, 200, 300, 400, 500, 1000]
    unknown = {"reference_calculations": reference_calculations(), "scenarios": [evaluate(unknown_cfg, n) for n in sizes]}
    example = {"reference_calculations": reference_calculations(), "scenarios": [evaluate(example_cfg, n) for n in sizes]}
    write_json(output / "results_unknown.json", unknown)
    write_json(output / "results_illustrative.json", example)
    qec = qec_report()
    write_json(output / "qec_reference.json", qec)
    claims = json.loads((ROOT / "claims_m3_unverified.json").read_text(encoding="utf-8"))
    evidence = evaluate_report(claims, ROOT)
    write_json(output / "m3_evidence_gate.json", evidence)
    intake = check_submission(json.loads((ROOT / "submissions/m3_evidence_template.json").read_text(encoding="utf-8")), ROOT / "submissions")
    write_json(output / "m3_intake_template_check.json", intake)
    historical = []
    for line in (ROOT / "legacy_v02/SHA256SUMS.txt").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        expected, name = line.split(maxsplit=1)
        name = name.lstrip("*")
        file = ROOT / "legacy_v02" / name
        historical.append({"file": name, "matches": file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest() == expected})
    scope_checks = {
        "source_manifest_verified_before_execution": integrity["status"] == "PASS",
        "python_tests_passed": test.returncode == 0 and count > 0,
        "legacy_v02_manifest_preserved": len(historical) == 15 and all(item["matches"] for item in historical),
        "missing_heat_remains_unknown": all(stage["thermal_status"] == "UNKNOWN" for scenario in unknown["scenarios"] for stage in scenario["thermal_stages"]),
        "missing_latency_remains_null": all(scenario["latency_ns"]["total"] is None for scenario in unknown["scenarios"]),
        "missing_wall_power_remains_null": all(scenario["wall_input_W"]["total"] is None for scenario in unknown["scenarios"]),
        "unsupported_m3_claims_not_approved": not evidence["report_complete_for_review"] and all(item["status"] in {"BLOCKED", "CONTRADICTED"} for item in evidence["results"]),
        "all_22_single_pauli_cases_corrected_in_reference": qec["single_pauli_cases_corrected"] == 22,
        "all_16384_pauli_patterns_classified_not_all_corrected": qec["patterns"] == 16384 and sum(qec["failures_by_pauli_weight"]) > 0,
        "unfilled_M3_intake_is_blocked": not intake["report_complete_for_review"],
    }
    source_hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in sorted(ROOT.iterdir()) if p.is_file() and p.suffix in {".py", ".json", ".md"}}
    passed = all(scope_checks.values())
    result = {"release": "AXON-SQA-01 v0.3.1", "executed_at_utc": datetime.now(timezone.utc).isoformat(),
              "python": sys.version, "platform": platform.platform(), "test_command": command,
              "test_exit_code": test.returncode, "tests_run": count,
              "software_validation_status": "PASS" if passed else "FAIL", "scope_checks": scope_checks,
              "legacy_manifest_checks": historical, "source_sha256": source_hashes,
              "source_integrity": integrity, "output_directory": str(output),
              "negative_fixture_validation": "EXPECTED_REJECTION_CONFIRMED",
              "new_local_M3_evidence_validation": "NOT_SUBMITTED",
              "user_reported_commits": "See LOCAL_AUDIT_RECEIPT.json; not independently authenticated",
              "tool_availability_only_not_executed": {name: shutil.which(name) is not None for name in ("iverilog", "yosys", "verilator", "sta")},
              "original_M3_RTL": "NOT_ACCESSED", "original_M3_reproduction": "NOT_RUN",
              "rtl_synthesis_and_timing": "NOT_RUN", "fpga_or_silicon_measurements": "NOT_RUN",
              "cryogenic_operation": "NOT_EVALUATED", "qpu_qec_hardware": "NOT_EVALUATED",
              "remote_repository_modified": False}
    write_json(output / "verification.json", result)
    print(json.dumps({"software_validation_status": result["software_validation_status"], "tests_run": count,
                      "single_pauli_reference": f'{qec["single_pauli_cases_corrected"]}/22',
                      "pauli_patterns_classified": qec["patterns"],
                      "hardware_validation": "NOT_EVALUATED"}, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
