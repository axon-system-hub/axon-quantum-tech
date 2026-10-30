## Optical CPNPU (PAT-34/35) Fusion Model

`fusion_pat34.rs` models the analog optical GEMV path (MZI phase modulation + PCM cell weights + balanced photodiode) vs the bit-exact digital `mac_0mul` path on a 544x2048 ternary matrix:

- **Extinction Ratio (ER)**: >= 40 dB required for cosine fidelity > 0.9999 and relative L2 error < 1.4%.
- **Phase noise tolerance**: Phase error sigma < 0.03 rad preserves cosine fidelity > 0.99999.
- **Quantum-Cryo Interconnect Synergy**:
  Using optical waveguides / fiber to bridge room temperature (300K) and cryogenic chambers (4K) eliminates the thermal heat leak of thousands of metallic coaxial cables (glass fiber thermal conductivity << copper). Combined with 0-MUL Sign-Select, dynamic on-die dissipation is minimized.

### Run
```
cargo run --release --bin fusion_pat34
```

