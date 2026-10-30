import math
import unittest

from qec_reference import (H, STABILIZER_SPAN, corrects, decode,
                           enumerate_paulis, exact_logical_failure, syndrome)


def encoded(a, b):
    # Construct encoded states independently by applying the three X stabilizers.
    vector = [0j] * 128
    for combination in range(8):
        basis = 0
        for j in range(3):
            if (combination >> j) & 1:
                basis ^= H[j]
        vector[basis] += a / math.sqrt(8)
        vector[basis ^ 127] += b / math.sqrt(8)
    return vector


def pauli(vector, x, z):
    output = [0j] * 128
    y_phase = 1j ** ((x & z).bit_count())
    for basis, amplitude in enumerate(vector):
        output[basis ^ x] = amplitude * (-1 if (basis & z).bit_count() & 1 else 1) * y_phase
    return output


def fidelity(left, right):
    return abs(sum(a.conjugate() * b for a, b in zip(left, right))) ** 2


class QECReferenceChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.enumeration = enumerate_paulis()

    def test_all_64_input_syndrome_pairs(self):
        for sx in range(8):
            for sz in range(8):
                x, z = decode(sx, sz)
                self.assertEqual(syndrome(x), sx)
                self.assertEqual(syndrome(z), sz)

    def test_no_error_and_21_single_paulis(self):
        self.assertTrue(corrects(0, 0))
        for q in range(7):
            for x, z in ((1 << q, 0), (0, 1 << q), (1 << q, 1 << q)):
                self.assertTrue(corrects(x, z))
        self.assertEqual(self.enumeration["successes_by_pauli_weight"][:2], [1, 21])

    def test_all_pauli_weight_counts(self):
        self.assertEqual(self.enumeration["patterns"], 4 ** 7)
        for w in range(8):
            self.assertEqual(self.enumeration["successes_by_pauli_weight"][w] +
                             self.enumeration["failures_by_pauli_weight"][w], math.comb(7, w) * 3 ** w)

    def test_multiqubit_counterexample_preserved(self):
        self.assertFalse(corrects(0b11, 0))
        self.assertGreater(self.enumeration["failures_by_pauli_weight"][2], 0)

    def test_zero_syndrome_does_not_mean_no_logical_error(self):
        self.assertEqual(syndrome(127), 0)
        self.assertFalse(corrects(127, 0))

    def test_stabilizers_act_trivially(self):
        for x in STABILIZER_SPAN:
            for z in STABILIZER_SPAN:
                self.assertTrue(corrects(x, z))

    def test_single_errors_preserve_four_encoded_states(self):
        states = [encoded(1, 0), encoded(0, 1), encoded(2 ** -.5, 2 ** -.5), encoded(2 ** -.5, 1j * 2 ** -.5)]
        errors = [(0, 0)] + [(x, z) for q in range(7) for x, z in ((1 << q, 0), (0, 1 << q), (1 << q, 1 << q))]
        for state in states:
            for x, z in errors:
                cx, cz = decode(syndrome(x), syndrome(z))
                self.assertAlmostEqual(fidelity(state, pauli(pauli(state, x, z), cx, cz)), 1)

    def test_all_patterns_match_independent_statevector_classification(self):
        # |0_L> and |+_L> distinguish all nontrivial logical Pauli residuals.
        states = [encoded(1, 0), encoded(2 ** -.5, 2 ** -.5)]
        for x in range(128):
            for z in range(128):
                cx, cz = decode(syndrome(x), syndrome(z))
                good = all(abs(fidelity(s, pauli(s, x ^ cx, z ^ cz)) - 1) < 1e-10 for s in states)
                self.assertEqual(good, corrects(x, z), (x, z))

    def test_depolarizing_endpoints_and_uniform_limit(self):
        counts = self.enumeration["failures_by_pauli_weight"]
        self.assertEqual(exact_logical_failure(0, counts), 0)
        self.assertAlmostEqual(exact_logical_failure(.75, counts), .75)
        for p in (.001, .01, .1, .5, 1):
            self.assertTrue(0 <= exact_logical_failure(p, counts) <= 1)

    def test_invalid_inputs_rejected(self):
        for value in (-1, 128, True, 1.5):
            with self.assertRaises(ValueError):
                syndrome(value)
        for value in (-1, 8, False, 1.5):
            with self.assertRaises(ValueError):
                decode(value, 0)
        for p in (-.1, 1.1, True, float("nan"), float("inf")):
            with self.assertRaises(ValueError):
                exact_logical_failure(p, [0] * 8)


if __name__ == "__main__":
    unittest.main()
