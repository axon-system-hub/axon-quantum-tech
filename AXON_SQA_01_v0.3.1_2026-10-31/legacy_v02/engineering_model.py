"""AXON staged engineering ledger v0.2; not a quantum/device simulator.

Unknown inputs stay unknown. All example powers are assumptions. Python 3.10+.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

H = 6.62607015e-34
K_B = 1.380649e-23
C = 299792458.0
LABELS = {"MEASURED", "FPGA-MEASURED", "SILICON-MEASURED", "SIMULATED",
          "THEORETICAL", "DERIVED", "ASSUMED", "TARGET"}
REQUIRED_HEAT_TERMS = {"control_core", "readout_chain", "DAC_and_RF_driver",
                       "absorbed_optical_power", "clock_memory", "phase_bias",
                       "regulator_loss", "supports_and_feeds", "radiation",
                       "fiber_conduction"}
REQUIRED_LATENCY_TERMS = {"measurement_integration", "ADC_and_demodulation",
                          "link_round_trip", "decoder_and_queue",
                          "DAC_and_driver", "pulse_delivery"}


def number(value, name, *, positive=False):
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError(f"{name}: finite numeric value required")
    if not math.isfinite(value) or value < 0 or (positive and value == 0):
        raise ValueError(f"{name}: invalid range")
    return float(value)


def integer(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ValueError(f"{name}: positive integer required")
    return value


def input_value(record, name):
    if not isinstance(record, dict):
        raise ValueError(f"{name}: evidence record required")
    if record.get("evidence") not in LABELS:
        raise ValueError(f"{name}: valid evidence label required")
    if not isinstance(record.get("source"), str) or not record["source"].strip():
        raise ValueError(f"{name}: source/assumption description required")
    value = record.get("value")
    return None if value is None else number(value, name)


def carnot_inverse_cop(cold_K, hot_K=300.0):
    cold = number(cold_K, "cold_K", positive=True)
    hot = number(hot_K, "hot_K", positive=True)
    if cold >= hot:
        raise ValueError("cold_K must be less than hot_K")
    return (hot - cold) / cold


def two_level_population(frequency_Hz, temperature_K):
    """Equilibrium two-level model, NOT transmon fidelity or a universal bound."""
    f = number(frequency_Hz, "frequency_Hz", positive=True)
    t = number(temperature_K, "temperature_K", positive=True)
    x = H * f / (K_B * t)
    z = math.exp(-x)
    return z / (1.0 + z)


def optical_delay_ps(length_m, group_index):
    return number(length_m, "length_m") * number(
        group_index, "group_index", positive=True) / C * 1e12


def extinction_ratios(er_dB):
    er = number(er_dB, "er_dB")
    return {"power_ratio": 10 ** (-er / 10),
            "field_amplitude_ratio": 10 ** (-er / 20)}


def mzi_outputs(phase_rad, incident_power_W=1.0):
    if not isinstance(phase_rad, (int, float)) or not math.isfinite(phase_rad):
        raise ValueError("phase_rad must be finite")
    p = number(incident_power_W, "incident_power_W")
    return p * math.cos(phase_rad / 2) ** 2, p * math.sin(phase_rad / 2) ** 2


def channel_count(plan, qubits):
    n = integer(qubits, "qubits")
    signals = integer(plan["signals_per_qubit"], "signals_per_qubit")
    waves = integer(plan["wavelengths_per_fiber"], "wavelengths_per_fiber")
    streams = integer(plan["streams_per_wavelength"], "streams_per_wavelength")
    directions = integer(plan["separate_directions"], "separate_directions")
    per_direction = math.ceil(n * signals / (waves * streams))
    fibers = per_direction * directions
    bitrate = input_value(plan["bitrate_per_signal_Gbps"], "bitrate_per_signal_Gbps")
    capacity = input_value(plan["capacity_per_wavelength_Gbps"], "capacity_per_wavelength_Gbps")
    # Each physical direction has its own fibers. No capacity sharing is assumed.
    required = None if bitrate is None else n * signals * bitrate
    available = None if capacity is None else per_direction * waves * capacity
    if required is None or available is None:
        bandwidth = "UNKNOWN"
    else:
        bandwidth = "WITHIN_ASSUMED_CAPACITY" if required <= available else "CAPACITY_EXCEEDED"
    return {"signals_per_direction": n * signals, "directional_signals_total": n * signals * directions,
            "fiber_count": fibers,
            "fiber_count_evidence": "DERIVED_FROM_ASSUMED_CHANNEL_PLAN",
            "required_Gbps_per_direction": required,
            "capacity_Gbps_per_direction": available, "bandwidth_status": bandwidth,
            "qualification": "Channel arithmetic only; no WDM hardware or crosstalk validation."}


def ledger(entries, multipliers):
    if not entries:
        raise ValueError("An empty ledger cannot establish a zero total")
    known = 0.0
    missing = []
    rows = []
    seen = set()
    for entry in entries:
        name = entry["name"]
        if name in seen:
            raise ValueError(f"duplicate ledger entry: {name}")
        seen.add(name)
        basis = entry.get("basis", "fixed")
        if basis not in multipliers:
            raise ValueError(f"{name}: unknown basis {basis}")
        v = input_value(entry, name)
        contribution = None if v is None else v * multipliers[basis]
        if contribution is None:
            missing.append(name)
        else:
            known += contribution
        rows.append({"name": name, "contribution": contribution,
                     "input_evidence": entry["evidence"], "source": entry["source"]})
    return {"known_subtotal": known, "total": None if missing else known,
            "missing": missing, "entries": rows}


def evaluate(config, qubits):
    if config.get("schema_version") != "0.2":
        raise ValueError("schema_version must be 0.2")
    if not config.get("stages"):
        raise ValueError("At least one thermal stage is required")
    channels = channel_count(config["channel_plan"], qubits)
    multipliers = {"fixed": 1, "per_qubit": qubits,
                   "per_signal": channels["directional_signals_total"],
                   "per_fiber": channels["fiber_count"]}
    stages = []
    for stage in config["stages"]:
        names = {entry["name"] for entry in stage.get("heat_terms_W", [])}
        if not REQUIRED_HEAT_TERMS.issubset(names):
            raise ValueError("Required heat categories must be present; use null or an explicitly justified zero")
        t = input_value(stage["temperature_K"], "temperature_K")
        cap = input_value(stage["cooling_capacity_W"], "cooling_capacity_W")
        heat = ledger(stage["heat_terms_W"], multipliers)
        if heat["total"] is None or cap is None:
            status, margin = "UNKNOWN", None
        else:
            margin = cap - heat["total"]
            status = "WITHIN_INPUT_BUDGET" if margin >= 0 else "INPUT_BUDGET_EXCEEDED"
        minimum_work = None
        if t is not None:
            penalty = carnot_inverse_cop(t)
            if heat["total"] is not None:
                minimum_work = heat["total"] * penalty
        stages.append({"name": stage["name"], "temperature_K": t,
                       "heat_W": heat, "capacity_W": cap, "margin_W": margin,
                       "thermal_status": status,
                       "ideal_refrigerator_minimum_work_W": minimum_work,
                       "ideal_work_note": "300 K heat rejection; reversible lower bound only. Not wall power or purchased LN2 energy."})
    if not REQUIRED_LATENCY_TERMS.issubset({entry["name"] for entry in config["latency_terms_ns"]}):
        raise ValueError("Required latency categories must be present")
    latency = ledger(config["latency_terms_ns"], {"fixed": 1})
    wall = ledger(config["wall_input_terms_W"], {"fixed": 1})
    return {"schema_version": "0.2", "scenario": config["name"], "qubits_requested": qubits,
            "evidence": "DERIVED_ENGINEERING_LEDGER; INPUT_LABELS_PRESERVED",
            "scope": "PROJECTED-AXON", "channel_plan": channels, "thermal_stages": stages,
            "latency_ns": latency, "wall_input_W": wall,
            "quantum_device_feasibility": "NOT_EVALUATED",
            "qec_fidelity": "NOT_EVALUATED",
            "warning": "No result is a demonstration of a working quantum computer, semiconductor or QEC loop."}


def reference_calculations():
    return {"evidence": "THEORETICAL/DERIVED, NOT HARDWARE MEASUREMENTS",
            "five_GHz_equilibrium_two_level": [
                {"temperature_K": t, "excited_probability": two_level_population(5e9, t)}
                for t in (0.015, 4.0, 77.0)],
            "carnot_work_per_W_removed_at_300K_sink": {
                str(t): carnot_inverse_cop(t) for t in (0.015, 4.0, 77.0)},
            "500um_delay_ps_assumed_group_index_3_48": optical_delay_ps(500e-6, 3.48),
            "500um_delay_ps_assumed_group_index_4_0": optical_delay_ps(500e-6, 4.0),
            "45dB_extinction": extinction_ratios(45),
            "1000_qubit_core_only_W_from_assumed_0_45mW_each": 1000 * 0.45e-3,
            "legacy_1000_qubit_W_from_assumed_18mW_and_three_0_8mW_lines": 1000 * (18e-3 + 3 * 0.8e-3),
            "power_proxy_C_vs_B_percent_from_user_report": {
                "zero_0_percent": (143 / 204 - 1) * 100,
                "zero_33_percent": (139 / 179 - 1) * 100,
                "zero_66_percent": (128 / 134 - 1) * 100},
            "area_proxy_C_vs_B_percent_from_user_report": (338 / 296 - 1) * 100}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path)
    parser.add_argument("--qubits", type=int, nargs="+", default=[100, 200, 300, 400, 500, 1000])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    output = {"reference_calculations": reference_calculations(),
              "scenarios": [evaluate(config, n) for n in args.qubits]}
    rendered = json.dumps(output, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
