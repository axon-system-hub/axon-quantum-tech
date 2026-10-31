"""Exploratory 300K vs 77K Ternary Differential BPD & Bandgap Shift Model (P4).

Evidence status: [ASSUMED / DERIVED].
Models semiconductor bandgap blue-shift (Varshni relation), differential balanced
photodiode (BPD) ADD/SUB/0-SKIP response, diode mismatch, and local-vs-remote
latency boundary separation. Not a hardware measurement.
"""
from dataclasses import dataclass, asdict
import math

HC_EV_NM = 1239.84193  # Planck constant * c in eV*nm


@dataclass(frozen=True)
class PhotodiodeMaterial:
    name: str
    eg0_ev: float       # Bandgap at 0K (eV)
    alpha_ev_k: float   # Varshni alpha (eV/K)
    beta_k: float       # Varshni beta (K)
    quantum_eff_peak: float  # Assumed peak internal quantum efficiency above bandgap
    dark_current_300k_na: float


STANDARD_INGAAS = PhotodiodeMaterial(
    name="Standard_In0.53Ga0.47As",
    eg0_ev=0.812,
    alpha_ev_k=4.9e-4,
    beta_k=327.0,
    quantum_eff_peak=0.80,
    dark_current_300k_na=2.0,
)

EXTENDED_INGAAS = PhotodiodeMaterial(
    name="Extended_In0.68Ga0.32As",
    eg0_ev=0.680,
    alpha_ev_k=4.5e-4,
    beta_k=300.0,
    quantum_eff_peak=0.72,
    dark_current_300k_na=15.0,
)


def bandgap_ev(material: PhotodiodeMaterial, temp_k: float) -> float:
    """Varshni empirical relation: Eg(T) = Eg(0) - alpha * T^2 / (T + beta)."""
    if temp_k < 0 or not math.isfinite(temp_k):
        raise ValueError("temp_k must be finite and >= 0")
    return material.eg0_ev - (material.alpha_ev_k * (temp_k ** 2)) / (temp_k + material.beta_k)


def cutoff_wavelength_nm(material: PhotodiodeMaterial, temp_k: float) -> float:
    """Cutoff wavelength lambda_c = hc / Eg(T) in nm."""
    eg = bandgap_ev(material, temp_k)
    return HC_EV_NM / eg


def modeled_responsivity_a_per_w(
    material: PhotodiodeMaterial,
    temp_k: float,
    wavelength_nm: float,
    edge_rolloff_ev: float = 0.015,
) -> float:
    """Assumed responsivity R(T, lambda) in A/W with smooth band-edge roll-off.

    When photon energy E_ph < Eg(T), absorption drops sharply (band-edge freeze-out).
    """
    if wavelength_nm <= 0 or not math.isfinite(wavelength_nm):
        raise ValueError("wavelength_nm must be positive and finite")
    eg = bandgap_ev(material, temp_k)
    e_photon = HC_EV_NM / wavelength_nm
    # Smooth Fermi-like absorption transition near the band edge
    delta_e = e_photon - eg
    if delta_e >= 3.0 * edge_rolloff_ev:
        absorption_factor = 1.0
    elif delta_e <= -3.0 * edge_rolloff_ev:
        absorption_factor = math.exp(delta_e / edge_rolloff_ev)
    else:
        absorption_factor = 1.0 / (1.0 + math.exp(-delta_e / edge_rolloff_ev))

    ideal_r = (material.quantum_eff_peak * absorption_factor * wavelength_nm) / 1239.84193
    return ideal_r


def modeled_dark_current_na(material: PhotodiodeMaterial, temp_k: float) -> float:
    """Assumed thermal dark current scaling between 300K and temp_k."""
    if temp_k <= 0:
        return 0.0
    if temp_k >= 300.0:
        return material.dark_current_300k_na
    # Simplified thermal generation suppression factor
    ratio = (temp_k / 300.0) ** 2 * math.exp(-bandgap_ev(material, temp_k) * (300.0 - temp_k) / (2.0 * 8.617e-5 * 300.0 * temp_k))
    return material.dark_current_300k_na * ratio


@dataclass(frozen=True)
class TernaryBpdConfig:
    temp_k: float
    wavelength_nm: float
    optical_power_mw: float
    cavity_reflectivity: float
    bpd_mismatch_ratio: float      # Fractional mismatch between (+) and (-) photodiodes, e.g., 0.02 (2%)
    extinction_leakage_ratio: float # Off-channel optical crosstalk/leakage, e.g., 0.01 (20 dB)
    decision_threshold_ua: float   # Current threshold in uA to classify +1 / 0 / -1
    laser_driver_active_mw: float
    laser_driver_skip_mw: float


def simulate_ternary_bpd_lane(material: PhotodiodeMaterial, cfg: TernaryBpdConfig, trit: int) -> dict:
    """Simulate a single ternary (+1, 0, -1) differential BPD measurement."""
    if trit not in (-1, 0, 1):
        raise ValueError("trit must be -1, 0, or +1")
    if not (0.0 <= cfg.cavity_reflectivity <= 1.0):
        raise ValueError("cavity_reflectivity must be in [0, 1]")
    if not (0.0 <= cfg.bpd_mismatch_ratio < 0.5):
        raise ValueError("bpd_mismatch_ratio must be in [0, 0.5)")

    r_pos = modeled_responsivity_a_per_w(material, cfg.temp_k, cfg.wavelength_nm)
    r_neg = r_pos * (1.0 - cfg.bpd_mismatch_ratio)
    dark_na = modeled_dark_current_na(material, cfg.temp_k)

    p_recv_mw = cfg.optical_power_mw * cfg.cavity_reflectivity

    if trit == 1:
        p_pos_mw = p_recv_mw
        p_neg_mw = p_recv_mw * cfg.extinction_leakage_ratio
        driver_mw = cfg.laser_driver_active_mw
    elif trit == -1:
        p_pos_mw = p_recv_mw * cfg.extinction_leakage_ratio
        p_neg_mw = p_recv_mw
        driver_mw = cfg.laser_driver_active_mw
    else:
        # 0-SKIP: optical source gated off
        p_pos_mw = 0.0
        p_neg_mw = 0.0
        driver_mw = cfg.laser_driver_skip_mw

    # Photocurrents in microamps (1 mW * 1 A/W = 1000 uA)
    i_pos_ua = (r_pos * p_pos_mw * 1000.0) + (dark_na * 1e-3)
    i_neg_ua = (r_neg * p_neg_mw * 1000.0) + (dark_na * (1.0 - cfg.bpd_mismatch_ratio) * 1e-3)
    i_diff_ua = i_pos_ua - i_neg_ua

    if i_diff_ua > cfg.decision_threshold_ua:
        classified = 1
    elif i_diff_ua < -cfg.decision_threshold_ua:
        classified = -1
    else:
        classified = 0

    return {
        "evidence": "ASSUMED / DERIVED; analytical semiconductor & KCL model",
        "material": material.name,
        "temp_k": cfg.temp_k,
        "wavelength_nm": cfg.wavelength_nm,
        "bandgap_ev": round(bandgap_ev(material, cfg.temp_k), 4),
        "cutoff_wavelength_nm": round(cutoff_wavelength_nm(material, cfg.temp_k), 2),
        "responsivity_pos_a_w": round(r_pos, 4),
        "responsivity_neg_a_w": round(r_neg, 4),
        "dark_current_na": dark_na,
        "input_trit": trit,
        "i_pos_ua": round(i_pos_ua, 4),
        "i_neg_ua": round(i_neg_ua, 4),
        "i_diff_ua": round(i_diff_ua, 4),
        "classified_trit": classified,
        "correct": classified == trit,
        "driver_power_mw": driver_mw,
    }


def evaluate_two_tier_loop_boundary(
    fiber_length_m_one_way: float = 1.0,
    group_index: float = 1.5,
    local_cavity_ps: float = 5.8,
    local_bpd_tia_ns: float = 0.35,
    local_0mul_decoder_ns: float = 0.91,
    local_feedback_driver_ns: float = 0.80,
    local_target_ns: float = 5.0,
) -> dict:
    """Explicitly separates the 300K<->77K WDM fiber trunk from the 77K local QEC loop."""
    c_m_s = 299792458.0
    fiber_roundtrip_ns = 2.0 * (fiber_length_m_one_way * group_index / c_m_s) * 1e9
    local_closed_loop_ns = (
        (local_cavity_ps * 1e-3)
        + local_bpd_tia_ns
        + local_0mul_decoder_ns
        + local_feedback_driver_ns
    )
    return {
        "evidence": "ASSUMED / TIMING-ANALYZED BOUNDARY SEPARATION",
        "outer_300k_to_77k_fiber_roundtrip_floor_ns": round(fiber_roundtrip_ns, 4),
        "outer_can_meet_5ns_target": fiber_roundtrip_ns <= local_target_ns,
        "inner_77k_local_loop_latency_ns": round(local_closed_loop_ns, 4),
        "inner_meets_5ns_target": local_closed_loop_ns <= local_target_ns,
        "architectural_conclusion": (
            "1m 300K-to-77K fiber round-trip (~10.0ns) exceeds 5ns purely by speed of light. "
            "Therefore, the <5ns QEC syndrome decode & feedback loop MUST execute locally inside "
            "the 77K stage using the 0-MUL RTL decoder, while the 2-fiber WDM trunk handles "
            "outer-loop T-ASM instruction dispatch and telemetry."
        ),
    }
