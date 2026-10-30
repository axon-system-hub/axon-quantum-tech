"""Bounded Steane [[7,1,3]] CSS reference; ideal, noiseless syndrome only.

Not the unavailable AXON M3 implementation. No circuit-level faults, readout
noise, leakage, continuous drift, time history or hardware timing are modelled.
Bit i represents data qubit i+1. Syndrome bit j is parity against H[j].
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

H = (0b1010101, 0b1100110, 0b1111000)


def bounded_int(value, maximum, name):
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= maximum:
        raise ValueError(f"{name} must be an integer in [0,{maximum}]")
    return value


def syndrome(mask):
    mask = bounded_int(mask, 127, "mask")
    return sum(((mask & row).bit_count() & 1) << j for j, row in enumerate(H))


def decode(sx, sz):
    """sx=H*x_error, sz=H*z_error; returns classical X/Z correction masks.

sx is the Z-check outcome locating X errors; sz is the X-check outcome
locating Z errors. This convention avoids ambiguous stabilizer naming.
"""
    sx = bounded_int(sx, 7, "sx")
    sz = bounded_int(sz, 7, "sz")
    return (0 if sx == 0 else 1 << (sx - 1),
            0 if sz == 0 else 1 << (sz - 1))


def row_span():
    span = {0}
    for row in H:
        span |= {v ^ row for v in tuple(span)}
    return frozenset(span)


STABILIZER_SPAN = row_span()


def corrects(x_error, z_error):
    x_error = bounded_int(x_error, 127, "x_error")
    z_error = bounded_int(z_error, 127, "z_error")
    cx, cz = decode(syndrome(x_error), syndrome(z_error))
    # A residual stabilizer acts trivially on every encoded logical state.
    return (x_error ^ cx) in STABILIZER_SPAN and (z_error ^ cz) in STABILIZER_SPAN


def enumerate_paulis():
    failures = [0] * 8
    successes = [0] * 8
    counterexample = None
    for x_error in range(128):
        for z_error in range(128):
            weight = (x_error | z_error).bit_count()
            good = corrects(x_error, z_error)
            (successes if good else failures)[weight] += 1
            if not good and counterexample is None:
                counterexample = {"x_error": x_error, "z_error": z_error, "weight": weight}
    return {"patterns": sum(successes) + sum(failures),
            "successes_by_pauli_weight": successes,
            "failures_by_pauli_weight": failures,
            "first_uncorrected_pattern": counterexample}


def exact_logical_failure(p, failures):
    """Independent depolarizing data error: I=1-p; X=Y=Z=p/3 per qubit."""
    if isinstance(p, bool) or not isinstance(p, (int, float)) or not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError("p must be finite in [0,1]")
    if len(failures) != 8:
        raise ValueError("eight failure-weight coefficients required")
    return sum(count * (p / 3) ** weight * (1 - p) ** (7 - weight)
               for weight, count in enumerate(failures))


def report():
    result = enumerate_paulis()
    return {"scope": "GENERAL_REFERENCE_NOT_AXON_M3", "evidence": "DERIVED_FINITE_ENUMERATION",
            "code": "Steane [[7,1,3]]", "noise_model": "independent data-qubit depolarizing; ideal noiseless syndrome",
            "measurement_rounds": 1, "data_qubits": 7,
            "single_pauli_cases_including_identity": 22,
            "single_pauli_cases_corrected": result["successes_by_pauli_weight"][0] + result["successes_by_pauli_weight"][1],
            **result,
            "logical_failure_examples": [{"assumed_p": p, "calculated_probability": exact_logical_failure(p, result["failures_by_pauli_weight"])}
                                          for p in (0.001, 0.01, 0.05)],
            "hardware_latency_ns": None, "hardware_power_W": None,
            "circuit_level_qec": "NOT_EVALUATED", "fault_tolerant_syndrome_extraction": "NOT_IMPLEMENTED"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = json.dumps(report(), indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.write_text(output, encoding="utf-8")
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
