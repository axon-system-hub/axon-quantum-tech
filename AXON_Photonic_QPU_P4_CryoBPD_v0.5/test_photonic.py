import math
import unittest
from photonic import phase, beamsplitter, probability, hom_coincidence, transmitted_probability

class PhotonicTest(unittest.TestCase):
    def test_balanced_single_photon(self):
        p = probability(beamsplitter((1,0)))
        self.assertAlmostEqual(p[0], .5)
        self.assertAlmostEqual(p[1], .5)
    def test_interference_phase(self):
        for phi, expected in ((0,0), (math.pi,1)):
            p = probability(beamsplitter(phase(beamsplitter((1,0)),phi)))
            self.assertAlmostEqual(p[0], expected)
            self.assertAlmostEqual(sum(p),1)
    def test_unitarity_arbitrary_input(self):
        x=(1/math.sqrt(3), 1j*math.sqrt(2/3))
        self.assertAlmostEqual(sum(probability(beamsplitter(x,.27))),1)
    def test_hom_indistinguishable(self):
        self.assertAlmostEqual(hom_coincidence(.5,1),0)
    def test_hom_distinguishable(self):
        self.assertAlmostEqual(hom_coincidence(.5,0),.5)
    def test_hom_unbalanced(self):
        self.assertAlmostEqual(hom_coincidence(.25,1),.25)
    def test_loss(self):
        self.assertAlmostEqual(transmitted_probability(.8,.9,.5),.36)
    def test_invalid(self):
        for fn,args in ((hom_coincidence,(-.1,1)),(hom_coincidence,(.5,1.1)),(transmitted_probability,(1.1,))):
            with self.assertRaises(ValueError): fn(*args)

if __name__ == '__main__': unittest.main()
