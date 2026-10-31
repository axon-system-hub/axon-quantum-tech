"""Comparative scheduling examples, not an optical link feasibility model."""
import json
from link_budget import Link, link_budget

COMMON = dict(qubits=50,slot_ns=10,rate_gbps=10,bits_down=64,bits_up=64,
              length_m_one_way=1,group_index=1.5,controller_ns=20,qpu_ns=100,
              roundtrip_target_ns=5,utilization=.8)

def compare():
    definitions = {
      'CWDM_4x13': ('CWDM example, 20 nm grid',4,13),
      'DWDM_10x5': ('DWDM example, 100 GHz grid',10,5),
      'DWDM_50x1': ('DWDM example, 100 GHz grid',50,1),
    }
    out={}
    for name,(description,wavelengths,slots) in definitions.items():
        out[name]={'description':description,
                   'calculation':link_budget(Link(**COMMON,wavelengths=wavelengths,slots=slots))}
    return {'evidence':'ASSUMED/DERIVED',
            'scope':'classical scheduling only; no verified wavelength plan or optical physical layer',
            'warning':'20 nm / 100 GHz are channel grids, not per-channel bit rates; channel counts and usable components are assumptions',
            'common_inputs':COMMON, 'cases':out}

if __name__=='__main__': print(json.dumps(compare(),indent=2,allow_nan=False))
