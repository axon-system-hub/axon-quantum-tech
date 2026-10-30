import copy
import json
import math
from pathlib import Path
import unittest

from engineering_model import (channel_count, carnot_inverse_cop, evaluate,
                              extinction_ratios, mzi_outputs, optical_delay_ps,
                              two_level_population)

ROOT = Path(__file__).resolve().parent


class EngineeringChecks(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "inputs_unknown.json").read_text(encoding="utf-8"))

    def test_unknown_never_thermal_pass(self):
        r = evaluate(self.config, 1000)
        self.assertTrue(all(s["thermal_status"] == "UNKNOWN" for s in r["thermal_stages"]))
        self.assertIsNone(r["wall_input_W"]["total"])
        self.assertIsNone(r["latency_ns"]["total"])
        self.assertEqual(r["quantum_device_feasibility"], "NOT_EVALUATED")

    def test_multiplexing_directions_and_channels(self):
        self.assertEqual(channel_count(self.config["channel_plan"], 1000)["fiber_count"], 94)
        p = copy.deepcopy(self.config["channel_plan"])
        p["signals_per_qubit"] = p["separate_directions"] = 1
        self.assertEqual(channel_count(p, 1000)["fiber_count"], 16)

    def test_missing_readout_blocks_total(self):
        cfg = json.loads((ROOT / "inputs_illustrative.json").read_text())
        r = evaluate(cfg, 1000)
        self.assertAlmostEqual(r["thermal_stages"][0]["heat_W"]["total"], 4.85094)
        cfg["stages"][0]["heat_terms_W"][1]["value"] = None
        r = evaluate(cfg, 1000)
        self.assertIsNone(r["thermal_stages"][0]["heat_W"]["total"])

    def test_explicit_zero_is_not_missing(self):
        cfg = json.loads((ROOT / "inputs_illustrative.json").read_text())
        for term in cfg["stages"][0]["heat_terms_W"]:
            term["value"] = 0
        r = evaluate(cfg, 1000)
        self.assertEqual(r["thermal_stages"][0]["heat_W"]["total"], 0)

    def test_exceeded_capacity(self):
        cfg = json.loads((ROOT / "inputs_illustrative.json").read_text())
        cfg["stages"][0]["cooling_capacity_W"]["value"] = 1
        self.assertEqual(evaluate(cfg, 1000)["thermal_stages"][0]["thermal_status"], "INPUT_BUDGET_EXCEEDED")

    def test_channel_capacity_independent_of_count(self):
        p = copy.deepcopy(self.config["channel_plan"])
        p["bitrate_per_signal_Gbps"]["value"] = 2
        p["capacity_per_wavelength_Gbps"]["value"] = 1
        self.assertEqual(channel_count(p, 1000)["bandwidth_status"], "CAPACITY_EXCEEDED")

    def test_carnot_lower_bound(self):
        self.assertAlmostEqual(carnot_inverse_cop(77), 223 / 77)
        self.assertEqual(carnot_inverse_cop(4), 74)
        with self.assertRaises(ValueError):
            carnot_inverse_cop(300)

    def test_mzi_conserves_energy_including_dark_setting(self):
        for phase in (0, math.pi / 4, math.pi / 2, math.pi, 7):
            a, b = mzi_outputs(phase, 0.003)
            self.assertAlmostEqual(a + b, 0.003)
        a, b = mzi_outputs(math.pi)
        self.assertAlmostEqual(a, 0)
        self.assertAlmostEqual(b, 1)

    def test_extinction_is_power_vs_amplitude(self):
        r = extinction_ratios(40)
        self.assertAlmostEqual(r["power_ratio"], 0.0001)
        self.assertAlmostEqual(r["field_amplitude_ratio"], 0.01)

    def test_flight_time_and_thermal_population(self):
        self.assertAlmostEqual(optical_delay_ps(500e-6, 4), 6.671281903963041)
        self.assertGreater(two_level_population(5e9, 77), 0.499)
        self.assertLess(two_level_population(5e9, 0.015), 2e-7)

    def test_bad_inputs_rejected(self):
        for invalid in (-1, float("inf"), float("nan"), True):
            cfg = copy.deepcopy(self.config)
            cfg["stages"][0]["heat_terms_W"][0]["value"] = invalid
            with self.assertRaises(ValueError):
                evaluate(cfg, 1000)
        for invalid in (0, -1, True, 1.5):
            with self.assertRaises(ValueError):
                channel_count(self.config["channel_plan"], invalid)

    def test_missing_provenance_rejected(self):
        cfg = copy.deepcopy(self.config)
        cfg["stages"][0]["heat_terms_W"][0]["source"] = ""
        with self.assertRaises(ValueError):
            evaluate(cfg, 1000)

    def test_omitted_heat_category_rejected(self):
        self.config["stages"][0]["heat_terms_W"].pop()
        with self.assertRaises(ValueError):
            evaluate(self.config, 1000)

    def test_empty_or_duplicate_ledger_rejected(self):
        cfg = copy.deepcopy(self.config)
        cfg["wall_input_terms_W"] = []
        with self.assertRaises(ValueError):
            evaluate(cfg, 1000)
        cfg = copy.deepcopy(self.config)
        cfg["wall_input_terms_W"] *= 2
        with self.assertRaises(ValueError):
            evaluate(cfg, 1000)


if __name__ == "__main__":
    unittest.main()
