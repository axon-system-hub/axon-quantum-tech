"""Scenario comparisons. All numbers are illustrative, not device specs."""
import json
from link_budget import Link, Thermal, link_budget, thermal_budget

base=dict(qubits=50,wavelengths=10,slots=5,slot_ns=10,rate_gbps=10,
          bits_down=64,bits_up=64,length_m_one_way=1,group_index=1.5,
          controller_ns=20,qpu_ns=100,roundtrip_target_ns=5,utilization=.8)
thermal=Thermal(fiber_count=2,fiber_heat_mw_each=2,optical_absorbed_mw=20,
                receivers_mw=40,controller_mw=100,support_wiring_mw=50,other_mw=30,
                cooling_capacity_mw=500,hot_k=300,cold_k=77)
scenarios={
    'baseline_10x5': Link(**base),
    'insufficient_slots_8x5': Link(**(base|{'wavelengths':8})),
    'bandwidth_fail_128bit': Link(**(base|{'bits_up':128})),
    'long_fiber_10m': Link(**(base|{'length_m_one_way':10})),
    'more_wavelengths_50x1': Link(**(base|{'wavelengths':50,'slots':1})),
}
print(json.dumps({'provenance':'all parameters are invented engineering assumptions, not AXON measurements',
                  'scope':'50 classical control/readout channels, not 50 operating photonic qubits',
                  'scenarios':{k:link_budget(v) for k,v in scenarios.items()},
                  'thermal':thermal_budget(thermal)},indent=2,allow_nan=False))
