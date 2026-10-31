import unittest
from compare_wdm import compare

class WDMTests(unittest.TestCase):
    def test_case_results_and_identical_payload(self):
        cases=compare()['cases']
        for name in cases:
            c=cases[name]['calculation']
            self.assertTrue(c['channel_allocation_ok'])
            self.assertTrue(c['up_packet_fits_slot'])
            self.assertEqual(c['payload_bits_per_slot_effective'],80)
        self.assertEqual(cases['CWDM_4x13']['calculation']['logical_channel_slots'],52)
        self.assertAlmostEqual(cases['CWDM_4x13']['calculation']['valid_packet_update_rate_hz'],1e9/130)
        self.assertEqual(cases['DWDM_10x5']['calculation']['valid_packet_update_rate_hz'],20e6)
        self.assertEqual(cases['DWDM_50x1']['calculation']['valid_packet_update_rate_hz'],100e6)
    def test_all_cases_use_the_same_fiber_floor(self):
        cases=compare()['cases']
        floors=[c['calculation']['roundtrip_fiber_propagation_floor_ns'] for c in cases.values()]
        self.assertTrue(all(abs(x-floors[0])<1e-12 for x in floors))

if __name__=='__main__': unittest.main()
