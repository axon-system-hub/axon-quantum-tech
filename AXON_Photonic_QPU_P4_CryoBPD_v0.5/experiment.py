"""Analytic loss and click model for a two-photon HOM reference experiment.

Assumptions: one photon in each input on every trial; balanced, lossless
beamsplitter; mode overlap represented by a Gaussian envelope; independent,
identical time-gate threshold detectors. No source imperfections or afterpulse.
"""
import math
import random


def _unit_interval(value, name):
    if not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(f'{name} must be finite and in [0,1]')
    return float(value)


def coincidence_probability(overlap, eta_a, eta_b, dark_a=0.0, dark_b=0.0):
    """P(both detectors click), including threshold saturation and dark counts.

    eta includes all independent path/detector losses after the beamsplitter.
    The three output occupations are 11, 20, 02; photons can bunch in one arm.
    """
    v, ea, eb, da, db = (_unit_interval(x, n) for x, n in
                          ((overlap,'overlap'), (eta_a,'eta_a'), (eta_b,'eta_b'),
                           (dark_a,'dark_a'), (dark_b,'dark_b')))
    click = lambda n, eta, dark: 1 - (1-dark)*(1-eta)**n
    p11 = (1-v)/2
    p20 = p02 = (1+v)/4
    return (p11*click(1,ea,da)*click(1,eb,db)
            + p20*click(2,ea,da)*db
            + p02*da*click(2,eb,db))


def scan(delays, width, visibility, eta_a, eta_b, dark_a, dark_b, shots, seed):
    if not isinstance(shots, int) or isinstance(shots, bool) or shots <= 0:
        raise ValueError('shots must be a positive integer')
    if not isinstance(seed, int) or isinstance(seed, bool):
        raise ValueError('seed must be an integer')
    if not math.isfinite(width) or width <= 0:
        raise ValueError('width must be positive and finite')
    v = _unit_interval(visibility, 'visibility')
    # Validate even an empty delay sequence.
    coincidence_probability(0, eta_a, eta_b, dark_a, dark_b)
    rng = random.Random(seed)
    rows = []
    for delay in delays:
        if not math.isfinite(delay):
            raise ValueError('delay must be finite')
        overlap = v * math.exp(-0.5 * (delay/width)**2)
        p = coincidence_probability(overlap, eta_a, eta_b, dark_a, dark_b)
        count = sum(rng.random() < p for _ in range(shots))
        rows.append({'delay':delay, 'overlap':overlap, 'expected_probability':p,
                     'coincidences':count, 'shots':shots, 'observed_probability':count/shots})
    return rows
