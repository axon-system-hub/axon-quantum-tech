"""Reproducible illustrative HOM scan; writes JSON to stdout."""
import json
from experiment import scan

if __name__ == '__main__':
    config = {'width':1.0, 'visibility':0.9, 'eta_a':0.70, 'eta_b':0.65,
              'dark_a':0.001, 'dark_b':0.001, 'shots':20000, 'seed':343536}
    print(json.dumps({'evidence':'SIMULATED', 'delay_unit':'arbitrary',
                      'config':config, 'rows':scan([-4,-2,-1,0,1,2,4], **config)},
                     indent=2, allow_nan=False))
