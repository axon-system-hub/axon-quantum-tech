# axon-quantum-tech

Rust reference models and synthesizable Verilog RTL for the AXON **0-MUL (Sign-Select add/sub)** datapath and Quantum Error Correction (QEC) decoders, aimed at cryogenic quantum-control datapaths where thermal budget is the limiting factor.

## Status (evidence tiers)
- 🟢 Functional: `mac_0mul` is bit-exact with the ternary-multiplier MAC (`cargo test`, 768 exhaustive + 200k random).
- 🟢 Functional (QEC): 3-qubit bit-flip and 5-qubit perfect code decoders verified bit-exact between Rust and Verilog (`tb_qec_decoder.v`, 25/25 PASS).
- 🟢 Synthesis (PPA - MAC): Under identical `synth -flatten; abc` synthesis, C (`mac_0mul`) achieves **-23.4% gates (295 vs 385)**, **-38.2% 4-LUTs (110 vs 178)**, and **-7.1% logic depth (26 vs 28)** vs B (`mac_tern_mul`).
- 🟢 Synthesis (PPA - QEC): 5-qubit single-cycle decoder synthesizes to **50 standard gates**, **20 4-LUTs**, and **9 logic levels** with 0 multipliers. 3-qubit decoder synthesizes to **86 gates** and **44 4-LUTs** with 0 multipliers.
- 🟠 ESTIMATED: Analytical thermal/scaling models (`engineering_model.py`, `scale_sim`). QPU feasibility and end-to-end physical QEC feedback latency remain **`NOT_EVALUATED`**.
- 🔴 TARGET: Silicon tape-out, physical QPU pulse-level QEC experiments, 77K/4K physical chip measurements.

## Core Reports & Verification Documents
- **RTL PPA 합성 보고서**: [`RTL_PPA_SYNTHESIS_REPORT.md`](RTL_PPA_SYNTHESIS_REPORT.md)
  - Yosys 0.70+ 및 ABC 기반 B (`mac_tern_mul`) vs C (`mac_0mul`) 및 QEC 디코더 정량 비교
- **RTL 소스코드**: [`rtl/`](rtl/)
  - `qec_decoder_3qubit_0mul.v`: 3-Qubit [[3, 1, 1]] 0-MUL 디코더
  - `qec_decoder_5qubit_0mul.v`: 5-Qubit [[5, 1, 3]] 단일 사이클 디코더
  - `tb_qec_decoder.v`: Icarus Verilog 비트 일치 테스트벤치
- **감사 및 엔지니어링 모델**: [`AXON_Quantum_Review_v0.2_2026-10-30/`](AXON_Quantum_Review_v0.2_2026-10-30/README.md)
  - GPT-6.1 Sol 레드팀 감사 보고서 및 14개 단위 테스트 검증 모델
- **특허 36 (AXON-PAT-36)**: [`PATENT_36_SPECIFICATION.md`](PATENT_36_SPECIFICATION.md)
- **마스터 개발 지침서**: [`AXON_QUANTUM_DIRECTIVE.md`](AXON_QUANTUM_DIRECTIVE.md)
- **광 CPNPU 융합 리포트**: [`OPTICAL_FUSION.md`](OPTICAL_FUSION.md)

## Usage
```bash
cargo test                             # All unit, exhaustive, and QEC tests
cargo run --release                    # 0-MUL reference model activity
cargo run --release --bin fusion_pat34 # Optical CPNPU MZI fusion model
cargo run --release --bin scale_sim    # 100-1000 qubit multi-qubit cryogenic scaling simulator

# RTL simulation:
iverilog -o sim_qec rtl/qec_decoder_3qubit_0mul.v rtl/qec_decoder_5qubit_0mul.v rtl/tb_qec_decoder.v
vvp sim_qec
```
