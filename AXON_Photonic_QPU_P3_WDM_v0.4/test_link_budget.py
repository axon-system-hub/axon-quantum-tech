import math
import unittest
from dataclasses import replace
from link_budget import Link,Thermal,link_budget,thermal_budget,C

class BudgetTests(unittest.TestCase):
    def setUp(self):
        self.x=Link(50,10,5,10,10,64,64,1,1.5,20,100,5,.8)
        self.t=Thermal(2,2,20,40,100,50,30,500,300,77)
    def test_baseline_bandwidth_and_timing(self):
        r=link_budget(self.x)
        self.assertTrue(r['channel_allocation_ok'])
        self.assertEqual(r['payload_bits_per_slot_effective'],80)
        self.assertEqual(r['valid_packet_update_rate_hz'],20_000_000)
        self.assertAlmostEqual(r['roundtrip_fiber_propagation_floor_ns'],2*1.5/C*1e9)
        self.assertTrue(r['fiber_floor_exceeds_target'])
    def test_packet_does_not_fit(self):
        r=link_budget(replace(self.x,bits_up=128))
        self.assertFalse(r['up_packet_fits_slot'])
        self.assertTrue(r['down_packet_fits_slot'])
        self.assertIsNone(r['valid_packet_update_rate_hz'])
    def test_no_shared_capacity_assumption(self):
        r=link_budget(replace(self.x,wavelengths=8))
        self.assertFalse(r['channel_allocation_ok'])
        self.assertIsNone(r['valid_packet_update_rate_hz'])
    def test_distance_and_thermal(self):
        a=link_budget(self.x); b=link_budget(replace(self.x,length_m_one_way=10))
        self.assertAlmostEqual(b['roundtrip_fiber_propagation_floor_ns'],10*a['roundtrip_fiber_propagation_floor_ns'])
        t=thermal_budget(self.t)
        self.assertEqual(t['cold_load_mw'],244)
        self.assertEqual(t['capacity_margin_mw'],256)
        self.assertAlmostEqual(t['ideal_carnot_min_electrical_power_mw'],244*(300/77-1))
        self.assertFalse(thermal_budget(replace(self.t,cooling_capacity_mw=100))['within_assumed_capacity'])
    def test_bad_inputs(self):
        for z in [replace(self.x,slot_ns=0),replace(self.x,rate_gbps=math.nan),replace(self.x,utilization=1.1),replace(self.x,slots=True),replace(self.x,group_index=.5)]:
            with self.assertRaises(ValueError): link_budget(z)
        with self.assertRaises(ValueError): thermal_budget(replace(self.t,hot_k=77))

if __name__=='__main__': unittest.main()
