import copy
import json
import math
from pathlib import Path
import unittest

from engineering_model import channel_count, evaluate, ledger, mzi_outputs

ROOT = Path(__file__).resolve().parent


class LedgerRegressions(unittest.TestCase):
    def setUp(self):
        self.cfg = json.loads((ROOT / "inputs_unknown.json").read_text(encoding="utf-8"))

    def test_aggregate_capacity_cannot_hide_overloaded_wavelength(self):
        plan = copy.deepcopy(self.cfg["channel_plan"])
        plan.update(signals_per_qubit=1, wavelengths_per_fiber=64,
                    streams_per_wavelength=2, separate_directions=1)
        plan["bitrate_per_signal_Gbps"]["value"] = 1
        plan["capacity_per_wavelength_Gbps"]["value"] = 1.5
        result = channel_count(plan, 65)
        self.assertLess(result["required_Gbps_per_direction"], result["capacity_Gbps_per_direction"])
        self.assertEqual(result["peak_required_Gbps_per_wavelength"], 2)
        self.assertEqual(result["bandwidth_status"], "CAPACITY_EXCEEDED")

    def test_balanced_single_stream_uses_capacity(self):
        plan = copy.deepcopy(self.cfg["channel_plan"])
        plan.update(signals_per_qubit=1, wavelengths_per_fiber=64,
                    streams_per_wavelength=2, separate_directions=1)
        plan["bitrate_per_signal_Gbps"]["value"] = 1
        plan["capacity_per_wavelength_Gbps"]["value"] = 1.5
        self.assertEqual(channel_count(plan, 64)["bandwidth_status"], "WITHIN_ASSUMED_CAPACITY")

    def test_boolean_phase_is_not_an_angle(self):
        with self.assertRaises(ValueError):
            mzi_outputs(True)

    def test_stage_names_are_unique(self):
        self.cfg["stages"].append(copy.deepcopy(self.cfg["stages"][0]))
        with self.assertRaises(ValueError):
            evaluate(self.cfg, 7)

    def test_stage_name_cannot_be_blank(self):
        self.cfg["stages"][0]["name"] = " "
        with self.assertRaises(ValueError):
            evaluate(self.cfg, 7)

    def test_overflowing_contribution_is_rejected(self):
        rows = [{"name": "test", "value": 1e308, "evidence": "ASSUMED", "source": "test", "basis": "per_qubit"}]
        with self.assertRaises(ValueError):
            ledger(rows, {"per_qubit": 1000})

    def test_overflowing_sum_is_rejected(self):
        rows = [{"name": str(i), "value": 1e308, "evidence": "ASSUMED", "source": "test"} for i in range(2)]
        with self.assertRaises(ValueError):
            ledger(rows, {"fixed": 1})

    def test_negative_multiplier_cannot_reduce_heat(self):
        rows = [{"name": "heat", "value": 1, "evidence": "ASSUMED", "source": "test"}]
        with self.assertRaises(ValueError):
            ledger(rows, {"fixed": -1})

    def test_blank_ledger_entry_name_rejected(self):
        rows = [{"name": "", "value": 1, "evidence": "ASSUMED", "source": "test"}]
        with self.assertRaises(ValueError):
            ledger(rows, {"fixed": 1})

    def test_unknowns_do_not_promote_hardware_validation(self):
        result = evaluate(self.cfg, 7)
        self.assertEqual(result["system_validation"], "NOT_EVALUATED")
        self.assertEqual(result["evidence_authentication"], "NOT_PERFORMED")


if __name__ == "__main__":
    unittest.main()
