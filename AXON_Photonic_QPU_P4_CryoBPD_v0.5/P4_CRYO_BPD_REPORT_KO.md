# AXON Photonic QPU P4 — 300K vs 77K 3진 차동 수신 및 밴드갭 천이 모델 (v0.5)

- **증거 수준**: 🟠 `[ASSUMED / DERIVED]` (Varshni 반도체 밴드갭 경험식 및 KCL 차동 전류 해석 모델. 실제 부품의 극저온 실측치가 아님)
- **검증 테스트**: `python -m unittest discover -v` (25/25 테스트 통과)

---

## 1. 핵심 물리 현상: 77K 냉각 시 표준 InGaAs의 밴드갭 청색 천이 (Blue-Shift)

반도체 광다이오드를 상온(300K)에서 액체질소 온도(77K)로 냉각하면, 격자 수축에 의해 에너지 밴드갭 $E_g(T)$가 커지고 차단 파장(Cutoff Wavelength, $\lambda_c = hc / E_g$)이 **단파장 쪽으로 이동(Blue-shift)**한다 (Varshni 관계식):

$$E_g(T) = E_g(0) - \frac{\alpha T^2}{T + \beta}$$

| 소재 및 온도 조건 | 밴드갭 $E_g(T)$ | 차단 파장 $\lambda_c(T)$ | 1550nm 응답도 $R$ (가정) | 1310nm 응답도 $R$ (가정) | 판정 |
|---|:---:|:---:|:---:|:---:|---|
| **표준 $\mathrm{In}_{0.53}\mathrm{Ga}_{0.47}\mathrm{As}$ @ 300K** | $0.742\,\mathrm{eV}$ | **$1671\,\mathrm{nm}$** | $0.962\,\mathrm{A/W}$ | $0.845\,\mathrm{A/W}$ | 🟢 상온 1550nm 정상 수신 |
| **표준 $\mathrm{In}_{0.53}\mathrm{Ga}_{0.47}\mathrm{As}$ @ 77K** | $0.805\,\mathrm{eV}$ | **$1540\,\mathrm{nm}$** | **$0.360\,\mathrm{A/W}$ (급감)** | **$0.845\,\mathrm{A/W}$** | ⚠️ **77K에서 1550nm 흡수단 이탈!** |
| **확장형 $\mathrm{In}_{0.68}\mathrm{Ga}_{0.32}\mathrm{As}$ @ 77K** | $0.673\,\mathrm{eV}$ | **$1843\,\mathrm{nm}$** | **$0.900\,\mathrm{A/W}$** | $0.761\,\mathrm{A/W}$ | 🟢 **77K에서도 1550nm 완벽 수신** |

### 설계 반영 결론 (BOM 및 부품 선정 규칙)
1. **상온(300K) 광 CPNPU 보드**: 일반 통신용 **표준 $\mathrm{In}_{0.53}\mathrm{Ga}_{0.47}\mathrm{As}$ BPD + 1550nm VCSEL** 조합을 그대로 사용 가능.
2. **극저온(77K) 광 CPNPU / 양자 제어 보드**:
   - **해법 A (파장 변경)**: 광원을 **1310nm (O-Band)** 또는 **1480~1510nm**로 낮추면, 저렴한 표준 InGaAs 포토다이오드로도 77K에서 감도 저하 없이 동작함 (150nm Au 미러는 1310nm에서도 반사율 $\ge 97.5\%$ 유지).
   - **해법 B (소자 변경)**: 1550nm C-Band DWDM 부품을 그대로 쓰려면 수신단에 **Extended-InGaAs ($\lambda_c \ge 1.9\,\mu\mathrm{m}$ @ 300K)** 포토다이오드를 지정해야 함.

---

## 2. 5ns QEC 루프와 광섬유 2가닥 WDM 트렁크의 2계층(Two-Tier) 경계 분리

P2·P3에서 확인된 바와 같이, 상온(300K)과 극저온(77K) 사이를 잇는 1m 광섬유의 왕복 전파 시간 바닥값은 빛의 속도에 의해 **약 $10.007\,\mathrm{ns}$**이므로 상온 왕복 경로로는 $5\,\mathrm{ns}$ 목표를 달성할 수 없다.

따라서 AXON 시스템은 제어 루프를 두 계층으로 엄격히 분리한다:

1. **내부 고속 폐루프 (Inner 77K Local QEC Loop — 목표 $< 5.0\,\mathrm{ns}$)**:
   - 77K 챔버 내부에서 **캐비티 광경로($5.8\,\mathrm{ps}$) + BPD/TIA($0.35\,\mathrm{ns}$) + 0-MUL RTL 조합 디코더($0.91\,\mathrm{ns}$) + 피드백 드라이버($0.80\,\mathrm{ns}$) = 약 $2.07\,\mathrm{ns}$** (타이밍 분석치)로 상온을 거치지 않고 즉각 오류를 정정.
2. **외부 광섬유 다중화 트렁크 (Outer 300K $\leftrightarrow$ 77K 2-Fiber DWDM Link — $50\sim 250\,\mathrm{ns}$)**:
   - 10파장 $\times$ 5슬롯(DWDM) 또는 4파장 $\times$ 13슬롯(CWDM) 광섬유 2가닥을 통해 상온 호스트에서 T-ASM 양자 회로 명령어를 내려보내고 신드롬 통계 로그를 수집하여, 구리 동축선 수백 가닥의 전도열($\sim\mathrm{W}$ 급)을 **수 $\mathrm{mW}$ 수준**으로 차단.
