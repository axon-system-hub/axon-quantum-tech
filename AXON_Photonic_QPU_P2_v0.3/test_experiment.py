import math
import unittest
from experiment import coincidence_probability, scan


class HomExperimentTests(unittest.TestCase):
    def test_ideal_coincidence_limits(self):
        self.assertAlmostEqual(coincidence_probability(1,1,1),0)
        self.assertAlmostEqual(coincidence_probability(0,1,1),.5)
    def test_efficiency_applies_to_split_component(self):
        self.assertAlmostEqual(coincidence_probability(0,.8,.5),.2)
        self.assertAlmostEqual(coincidence_probability(1,.8,.5),0)
    def test_dark_counts_and_bunching(self):
        # Fully bunched light: each side has probability 1/2 of two photons.
        # Threshold click with two photons, eta=.5, is .75.
        self.assertAlmostEqual(coincidence_probability(1,.5,.5,.1,.1),.0775)
        self.assertAlmostEqual(coincidence_probability(.5,0,0,.1,.2),.02)
    def test_detector_symmetry(self):
        self.assertAlmostEqual(coincidence_probability(.7,.8,.3,.01,.02),
                               coincidence_probability(.7,.3,.8,.02,.01))
    def test_scan_seed_and_symmetry(self):
        kw=dict(width=1,visibility=.9,eta_a=.8,eta_b=.7,dark_a=0,dark_b=0,shots=5000,seed=123)
        rows=scan([-2,0,2],**kw)
        self.assertEqual(rows,scan([-2,0,2],**kw))
        self.assertAlmostEqual(rows[0]['expected_probability'],rows[2]['expected_probability'])
        self.assertLess(rows[1]['expected_probability'],rows[0]['expected_probability'])
        self.assertAlmostEqual(rows[1]['observed_probability'],rows[1]['expected_probability'],delta=.025)
    def test_invalid_parameters(self):
        for value in (-.1, 1.1, math.nan, math.inf):
            with self.assertRaises(ValueError): coincidence_probability(value,.5,.5)
        with self.assertRaises(ValueError): scan([],0,1,1,1,0,0,1,1)
        with self.assertRaises(ValueError): scan([],1,1,1,1,0,0,0,1)
        with self.assertRaises(ValueError): scan([math.nan],1,1,1,1,0,0,1,1)

if __name__ == '__main__': unittest.main()
