"""Ideal dual-rail and two-photon reference; not a hardware model."""
import cmath
import math

def phase(state, phi):
    a, b = state
    return (a, b * cmath.exp(1j * phi))

def beamsplitter(state, theta=math.pi/4):
    a, b = state
    c, s = math.cos(theta), math.sin(theta)
    return (c*a + 1j*s*b, 1j*s*a + c*b)

def probability(state):
    return tuple(abs(x)**2 for x in state)

def hom_coincidence(reflectivity, indistinguishability=1.0):
    """Independent single photons, lossless coupler; indistinguishability in [0,1]."""
    r, v = reflectivity, indistinguishability
    if not (0 <= r <= 1 and 0 <= v <= 1):
        raise ValueError('reflectivity and indistinguishability must be in [0,1]')
    return (1-r)**2 + r**2 - 2*v*r*(1-r)

def transmitted_probability(*efficiencies):
    """Independent intensity efficiencies only; no noise or correlated loss."""
    if any(not 0 <= e <= 1 for e in efficiencies):
        raise ValueError('efficiency must be in [0,1]')
    return math.prod(efficiencies)
