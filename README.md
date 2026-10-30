# axon-quantum-tech

Rust reference models for the AXON **0-MUL (Sign-Select add/sub)** vs multiplier MAC study,
aimed at cryogenic quantum-control datapaths where thermal budget is the limiting factor.

## Status (evidence tiers)
- 🟢 Functional: `mac_0mul` is bit-exact with the ternary-multiplier MAC (`cargo test`).
- 🟢 Verification: MZI optical 0-SKIP model (`fusion_pat34`) verified with ER >= 45dB, cosine > 0.9999.
- 🟠 ESTIMATED: 100-1000 qubit cryogenic thermal/scaling simulation (`scale_sim`).
- 🔴 TARGET: Sky130 + OpenSTA power/timing, 4K/77K device measurements, physical qubit pulse tests.

## Official Patent & Architecture Documents
- **특허 36 (AXON-PAT-36)**: [`PATENT_36_SPECIFICATION.md`](PATENT_36_SPECIFICATION.md)
  - 액체질소(77K) 극저온 전도 냉각 및 광학 PIM 직결 인터페이스 기반 무곱셈 1,000 큐비트 데이터센터 랙 실장형 양자-고전 하이브리드 컴퓨터 시스템
- **마스터 개발 지침서**: [`AXON_QUANTUM_DIRECTIVE.md`](AXON_QUANTUM_DIRECTIVE.md)
  - 5대 기본 공리 및 L0~L4 풀스택 아키텍처 규범
- **광 CPNPU 융합 리포트**: [`OPTICAL_FUSION.md`](OPTICAL_FUSION.md)

## Usage
```bash
cargo test
cargo run --release                    # 0-MUL reference model activity
cargo run --release --bin fusion_pat34 # Optical CPNPU MZI fusion model
cargo run --release --bin scale_sim    # 100-1000 qubit multi-qubit cryogenic scaling simulator
```
