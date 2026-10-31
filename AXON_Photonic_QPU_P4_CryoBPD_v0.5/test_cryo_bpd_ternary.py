import unittest
from cryo_bpd_ternary import (
    STANDARD_INGAAS,
    EXTENDED_INGAAS,
    TernaryBpdConfig,
    bandgap_ev,
    cutoff_wavelength_nm,
    modeled_responsivity_a_per_w,
    simulate_ternary_bpd_lane,
    evaluate_two_tier_loop_boundary,
)


class CryoBpdTernaryTests(unittest.TestCase):
    def test_varshni_bandgap_blueshift_on_cooling(self):
        # Standard InGaAs bandgap increases on cooling from 300K to 77K
        eg_300 = bandgap_ev(STANDARD_INGAAS, 300.0)
        eg_77 = bandgap_ev(STANDARD_INGAAS, 77.0)
        self.assertGreater(eg_77, eg_300)

        # Cutoff wavelength shifts shorter (blue-shift) at 77K
        lc_300 = cutoff_wavelength_nm(STANDARD_INGAAS, 300.0)
        lc_77 = cutoff_wavelength_nm(STANDARD_INGAAS, 77.0)
        self.assertGreater(lc_300, 1600.0)
        self.assertLess(lc_77, 1550.0)  # Drops below 1550nm at 77K!

    def test_standard_vs_extended_ingaas_at_1550nm_77k(self):
        # At 300K, standard InGaAs has high responsivity at 1550nm
        r_std_300 = modeled_responsivity_a_per_w(STANDARD_INGAAS, 300.0, 1550.0)
        self.assertGreater(r_std_300, 0.85)

        # At 77K, standard InGaAs experiences band-edge roll-off at 1550nm
        r_std_77 = modeled_responsivity_a_per_w(STANDARD_INGAAS, 77.0, 1550.0)
        self.assertLess(r_std_77, r_std_300 * 0.5)

        # Extended-InGaAs preserves full 1550nm responsivity at 77K
        r_ext_77 = modeled_responsivity_a_per_w(EXTENDED_INGAAS, 77.0, 1550.0)
        self.assertGreater(r_ext_77, 0.85)

        # Or Standard InGaAs at 1310nm O-band preserves full responsivity at 77K
        r_std_1310_77 = modeled_responsivity_a_per_w(STANDARD_INGAAS, 77.0, 1310.0)
        self.assertGreater(r_std_1310_77, 0.80)

    def test_ternary_classification_and_0skip_power(self):
        cfg = TernaryBpdConfig(
            temp_k=77.0,
            wavelength_nm=1550.0,
            optical_power_mw=1.0,
            cavity_reflectivity=0.985,
            bpd_mismatch_ratio=0.03,
            extinction_leakage_ratio=0.01,
            decision_threshold_ua=200.0,
            laser_driver_active_mw=12.0,
            laser_driver_skip_mw=0.5,
        )
        for trit in (-1, 0, 1):
            res = simulate_ternary_bpd_lane(EXTENDED_INGAAS, cfg, trit)
            self.assertTrue(res["correct"], f"Failed to classify trit {trit} at 77K")

        res_zero = simulate_ternary_bpd_lane(EXTENDED_INGAAS, cfg, 0)
        res_pos = simulate_ternary_bpd_lane(EXTENDED_INGAAS, cfg, 1)
        self.assertLess(res_zero["driver_power_mw"], res_pos["driver_power_mw"])

    def test_two_tier_loop_boundary_separation(self):
        b = evaluate_two_tier_loop_boundary(fiber_length_m_one_way=1.0)
        self.assertFalse(b["outer_can_meet_5ns_target"])
        self.assertTrue(b["inner_meets_5ns_target"])


if __name__ == "__main__":
    unittest.main()
