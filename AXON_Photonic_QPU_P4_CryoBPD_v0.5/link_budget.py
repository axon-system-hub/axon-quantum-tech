"""Exploratory classical optical control/readout budget; not a QPU model."""
from dataclasses import dataclass, asdict
import math

C = 299792458.0

def finite_number(value, name, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{name}: finite number required')
    if value < 0 or (positive and value == 0):
        raise ValueError(f'{name}: invalid range')
    return float(value)

def positive_int(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f'{name}: positive integer required')
    return value

@dataclass(frozen=True)
class Link:
    qubits: int
    wavelengths: int
    slots: int
    slot_ns: float
    rate_gbps: float
    bits_down: int
    bits_up: int
    length_m_one_way: float
    group_index: float
    controller_ns: float
    qpu_ns: float
    roundtrip_target_ns: float
    utilization: float

def link_budget(x):
    q=positive_int(x.qubits,'qubits'); w=positive_int(x.wavelengths,'wavelengths')
    s=positive_int(x.slots,'slots'); bd=positive_int(x.bits_down,'bits_down'); bu=positive_int(x.bits_up,'bits_up')
    slot=finite_number(x.slot_ns,'slot_ns',True); rate=finite_number(x.rate_gbps,'rate_gbps',True)
    length=finite_number(x.length_m_one_way,'length_m_one_way')
    group=finite_number(x.group_index,'group_index',True)
    if group < 1: raise ValueError('group_index must be >= 1')
    ct=finite_number(x.controller_ns,'controller_ns'); qt=finite_number(x.qpu_ns,'qpu_ns')
    target=finite_number(x.roundtrip_target_ns,'roundtrip_target_ns',True)
    u=finite_number(x.utilization,'utilization',True)
    if u>1: raise ValueError('utilization must be <= 1')
    cap=rate*slot*u # Gbit/s * ns = bits
    frame=s*slot
    propagation=length*group/C*1e9
    # One occupied slot per channel in each frame. Wait for each next assigned
    # slot can approach a full frame; full slot is charged in each direction.
    # This is a conservative scheduling envelope, not an empirical bound.
    env=2*frame + 2*slot + 2*propagation + ct + qt
    fiber_floor=2*propagation
    return {'label':'ASSUMED / DERIVED; classical control path only',
        'input':asdict(x), 'fiber_count_assumed':2,
        'logical_channel_slots':w*s, 'requested_channels':q,
        'channel_allocation_ok':q<=w*s,
        'payload_bits_per_slot_effective':cap,
        'down_packet_fits_slot':bd<=cap, 'up_packet_fits_slot':bu<=cap,
        'slot_opportunity_rate_per_channel_hz':1e9/frame,
        'valid_packet_update_rate_hz':(1e9/frame if q<=w*s and bd<=cap and bu<=cap else None),
        'one_way_fiber_propagation_ns':propagation,
        'roundtrip_fiber_propagation_floor_ns':fiber_floor,
        'conservative_two_way_schedule_envelope_ns':env,
        'fiber_floor_exceeds_target':fiber_floor>target,
        'envelope_meets_target':env<=target,
        'target_is_not_hardware_evidence':True,
        'per_wavelength_rule':'at most one packet per assigned slot; equal rate and fixed slot per wavelength',
        'excluded':'optical switching, guard time beyond utilization allowance, detector noise, jitter, encoding and QEC quality; 5ns target in this model means remote round trip, not 77K local loop'}

@dataclass(frozen=True)
class Thermal:
    fiber_count: int
    fiber_heat_mw_each: float
    optical_absorbed_mw: float
    receivers_mw: float
    controller_mw: float
    support_wiring_mw: float
    other_mw: float
    cooling_capacity_mw: float
    hot_k: float
    cold_k: float

def thermal_budget(x):
    n=positive_int(x.fiber_count,'fiber_count')
    names=['fiber_heat_mw_each','optical_absorbed_mw','receivers_mw','controller_mw','support_wiring_mw','other_mw']
    v={k:finite_number(getattr(x,k),k) for k in names}
    capacity=finite_number(x.cooling_capacity_mw,'cooling_capacity_mw',True)
    hot=finite_number(x.hot_k,'hot_k',True); cold=finite_number(x.cold_k,'cold_k',True)
    if hot<=cold: raise ValueError('hot_k must exceed cold_k')
    components={'fiber_conduction':n*v['fiber_heat_mw_each'], **{k:v[k] for k in names if k!='fiber_heat_mw_each'}}
    total=sum(components.values())
    return {'label':'ASSUMED / DERIVED; cold-stage only', 'input':asdict(x),
            'components_mw':components,'cold_load_mw':total,'capacity_margin_mw':capacity-total,
            'within_assumed_capacity':total<=capacity,
            'ideal_carnot_min_electrical_power_mw':total*(hot/cold-1),
            'carnot_is_not_real_power':True,
            'scope':'assumed heat into cold stage; no material or cryocooler measurements'}
