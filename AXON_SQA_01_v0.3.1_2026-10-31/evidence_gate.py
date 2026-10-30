"""Check report completeness and artifact hashes, never authenticate hardware.

READY_FOR_REVIEW means required local artifacts/metadata are present and
internally consistent. It does not mean the measurements are genuine/correct.
Default CLI exit status is 2 for blocked or contradicted claims, 0 otherwise.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re

from release_integrity import safe_relative

REQUIREMENTS = {
    "resource_count": ("tool_version", "target", "top", "command", "mapping_stage"),
    "zero_multiplier": ("tool_version", "target", "top", "command", "pre_mapping_mul_count", "mapped_dsp_count", "structural_review"),
    "latency": ("method", "start_event", "end_event", "operating_conditions"),
    "cryogenic_operation": ("device", "temperature_K", "duration_s", "test_protocol", "pass_fail_criteria", "observed_errors"),
    "qec_e2e": ("code", "distance", "data_qubits", "rounds", "noise_model", "start_event", "end_event", "logical_error_rate", "rounds_per_second", "tail_latency_ns", "feedback_boundary"),
    "os_jitter": ("device", "firmware", "workload", "samples", "duration_s", "start_event", "end_event", "maximum_observed_ns", "instrument_resolution_ns"),
}


def numeric(value):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value) and value >= 0


def nonempty(value):
    return (bool(value.strip()) if isinstance(value, str)
            else value is not None and value != [] and value != {})


def checked_artifact(artifact, root):
    if not isinstance(artifact, dict):
        return "artifact must be an object"
    name, expected = artifact.get("path"), artifact.get("sha256")
    if not isinstance(expected, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected):
        return "artifact requires relative path and sha256"
    if not safe_relative(name):
        return "artifact path must remain under evidence root"
    path = Path(name)
    if path.is_absolute() or ".." in path.parts:
        return "artifact path must remain under evidence root"
    base = Path(root).resolve()
    resolved = (base / path).resolve()
    if not resolved.is_relative_to(base):
        return "artifact path escapes evidence root"
    if not resolved.is_file():
        return "artifact file missing"
    actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
    return None if actual == expected.lower() else "artifact hash mismatch"


def assess(claim, root):
    if not isinstance(claim, dict):
        return {"id": None, "status": "BLOCKED", "issues": ["claim must be an object"]}
    issues = []
    contradictions = []
    kind, value = claim.get("kind"), claim.get("value")
    meta = claim.get("metadata", {})
    if not isinstance(meta, dict):
        meta = {}
        issues.append("metadata must be an object")
    if not isinstance(claim.get("id"), str) or not claim["id"].strip():
        issues.append("nonempty claim id required")
    if not numeric(value):
        issues.append("finite nonnegative claim value required; unknown is not zero")
    if kind == "zero_power":
        contradictions.append("0-MUL does not imply zero power; use measured/estimated finite power with boundary and resolution")
    elif kind not in REQUIREMENTS:
        issues.append("unsupported claim kind")
    else:
        for key in REQUIREMENTS[kind]:
            if not nonempty(meta.get(key)):
                issues.append(f"missing metadata: {key}")
        if kind == "latency":
            method = meta.get("method")
            if method == "ltp_only":
                contradictions.append("topological depth is not a timing analysis in ns")
            elif method == "sta":
                for key in ("library_corner", "constraints", "parasitics_model", "input_slew", "output_load"):
                    if not nonempty(meta.get(key)):
                        issues.append(f"missing STA metadata: {key}")
            elif method == "post_route_fpga":
                for key in ("part_and_speed_grade", "constraints", "routing_report"):
                    if not nonempty(meta.get(key)):
                        issues.append(f"missing routed timing metadata: {key}")
            elif method == "hardware_measurement":
                for key in ("instrument", "resolution_ns", "samples", "calibration"):
                    if not nonempty(meta.get(key)):
                        issues.append(f"missing measurement metadata: {key}")
            elif method != "ltp_only":
                issues.append("unsupported timing method")
        if kind == "zero_multiplier":
            if value != 0:
                contradictions.append("zero_multiplier claim requires count zero")
            if any(type(meta.get(k)) is not int or meta[k] != 0
                   for k in ("pre_mapping_mul_count", "mapped_dsp_count")):
                issues.append("pre-mapping operator and mapped DSP counts must both be zero for this narrow gate")
            if meta.get("structural_review") != "multiplier_free_for_declared_domain":
                issues.append("mapped structural/domain review required; a post-map $mul=0 is insufficient")
        for key in ("temperature_K", "duration_s", "samples", "resolution_ns", "instrument_resolution_ns", "rounds_per_second", "distance", "data_qubits", "rounds"):
            if key in meta and (not numeric(meta[key]) or meta[key] == 0):
                issues.append(f"{key} must be positive")
        for key in ("logical_error_rate", "tail_latency_ns", "maximum_observed_ns", "observed_errors"):
            if key in meta and not numeric(meta[key]):
                issues.append(f"{key} must be nonnegative and finite")
        if numeric(meta.get("logical_error_rate")) and meta["logical_error_rate"] > 1:
            issues.append("logical_error_rate must be at most 1")
        if kind == "resource_count" and numeric(value) and not float(value).is_integer():
            issues.append("resource count must be integer")
        for key in ("samples", "distance", "data_qubits", "rounds", "observed_errors"):
            if key in meta and type(meta[key]) is not int:
                issues.append(f"{key} must be an integer")
    artifacts = claim.get("artifacts", [])
    if not isinstance(artifacts, list) or not artifacts:
        issues.append("raw local evidence artifacts required")
    else:
        for artifact in artifacts:
            error = checked_artifact(artifact, root)
            if error:
                issues.append(error)
    status = "CONTRADICTED" if contradictions else ("BLOCKED" if issues else "READY_FOR_REVIEW")
    return {"id": claim.get("id"), "status": status, "issues": contradictions + issues,
            "hardware_authentication": "NOT_PERFORMED"}


def evaluate_report(report, root):
    if not isinstance(report, dict) or report.get("schema_version") != "0.3":
        raise ValueError("schema_version must be 0.3")
    claims = report.get("claims")
    if not isinstance(claims, list) or not claims:
        raise ValueError("nonempty claims list required")
    ids = [c.get("id") for c in claims if isinstance(c, dict)]
    if any(not isinstance(i, str) for i in ids) or len(ids) != len(set(ids)):
        raise ValueError("claim ids must be unique strings")
    results = [assess(c, root) for c in claims]
    ready = all(r["status"] == "READY_FOR_REVIEW" for r in results)
    return {"schema_version": "0.3", "report_complete_for_review": ready,
            "results": results, "hardware_validation": "NOT_EVALUATED",
            "note": "Presence/hash checker only. Hashes do not authenticate provenance or test correctness."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path)
    parser.add_argument("--root", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = evaluate_report(json.loads(args.report.read_text(encoding="utf-8")), args.root or args.report.parent)
    except (ValueError, OSError, TypeError, KeyError) as exc:
        parser.exit(2, f"Invalid evidence report: {exc}\n")
    rendered = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    raise SystemExit(0 if result["report_complete_for_review"] else 2)


if __name__ == "__main__":
    main()
