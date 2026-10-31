# AXON-PAT-35/36 Optical CPNPU Carrier Board - 거버 제작 및 발주 검증 보고서
**Document ID:** `AXON-PCB-GERBER-REP-01`  
**Classification:** `AXON Sovereign Hardware Release`  
**생성 일자:** 2026-10-31 KST  
**검증 상태:** 🟢 `[VERIFIED_PRODUCTION_READY]` (6층 RS-274X 문법·G36/G37 동박 평면·74개 홀·전기적 결선·KiCad S-Expr 전수 검증 통과)  

---

## 1. 거버 패키지 파일 명세 (6-Layer 완결 구성)

본 패키지는 $75.0 \times 75.0\,\mathrm{mm}$ 6층 광학 CPNPU 캐리어 보드를 PCB 전문 제조사(한샘디지텍, 샘플PCB, JLCPCB, PCBWay 등)에 직접 발주할 수 있는 표준 RS-274X 및 IPC-NC-349 Excellon NC Drill 파일 세트입니다.

| 파일명 | 레이어 설명 | 표준 확장자 | 포맷 규격 | 비고 |
|---|---|:---:|:---:|---|
| `AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr` | 기판 외형선 (75×75mm, 1.5mm 챔퍼) | `.gko / .gml` | RS-274X (4.6) | 0.15mm 경계선 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_SilkS.gto` | 상면 실크스크린 (부품 외곽, 58mm 리드선) | `.gto` | RS-274X (4.6) | 텍스트 및 조립 가이드 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl` | **L1 상면 동박** (VCSEL, BPD 2단자, KCL 버스, OPA855, SMA) | `.gtl` | RS-274X (4.6) | ENIG 금도금 패턴 |
| `AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1` | **L2 내층 1**: 솔리드 연속 접지면 (GND Reference) | `.g1` | RS-274X (4.6) | `G36/G37` 솔리드 폴리곤 (NPTH 이격) |
| `AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2` | **L3 내층 2**: 솔리드 전원 분할면 (+3.3V, +1.8V, -3.3V) | `.g2` | RS-274X (4.6) | `G36/G37` 3분할 폴리곤 |
| `AXON_OPTICAL_CPNPU_CARRIER-In3_Cu.g3` | **L4 내층 3**: 16채널 VCSEL ↔ Samtec 스트립라인 배선층 | `.g3` | RS-274X (4.6) | 16채널 내층 차폐 팬아웃 |
| `AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4` | **L5 내층 4**: 솔리드 2차 차폐 접지면 (Shield GND) | `.g4` | RS-274X (4.6) | `G36/G37` 솔리드 폴리곤 |
| `AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl` | **L6 하면 동박** (차폐 접지 및 비아 랜드) | `.gbl` | RS-274X (4.6) | 전면 비아 랜드 및 마운팅 패드 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts` | 상면 솔더마스크 (54mm Au 접지링·SMA 중심핀 개구 포함) | `.gts` | RS-274X (4.6) | 54.1mm 원형 Au 노출 |
| `AXON_OPTICAL_CPNPU_CARRIER-B_Mask.gbs` | 하면 솔더마스크 | `.gbs` | RS-274X (4.6) | 비아 텐팅(Tenting), M2.5 개구 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Paste.gtp` | 상면 메탈마스크 (솔더 페이스트 개구부) | `.gtp` | RS-274X (4.6) | SMT 스텐실 제작용 |
| `AXON_OPTICAL_CPNPU_CARRIER.drl` | Excellon NC Drill (총 74개 드릴 홀) | `.drl` | IPC-NC-349 (Format 2) | 명시적 소수점 좌표 (`G90`) |
| `AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb` | KiCad PCB 원본 레이아웃 파일 (6층 정의) | `.kicad_pcb` | KiCad 7 / 8 S-Expr | HTML 주석 제거·S-Expr 문법 무결 |

- **턴키 발주 압축파일**: `AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip` (13개 파일, 9,413 bytes)

---

## 2. 기구 및 PCB 제조 파라미터 지정값

PCB 주문 시 아래 사양을 발주서에 그대로 지정합니다:

```text
1. 기판 크기: 75.0 mm x 75.0 mm
2. 층수: 6층 (Layer Count: 6 Layers — F_Cu, In1_Cu, In2_Cu, In3_Cu, In4_Cu, B_Cu)
3. 기판 두께: 1.6 mm
4. 모재(Material): 하이브리드 고주파 적층 (Rogers RO4350B [L1-L2, L5-L6] + High-Tg FR-4 [Core])
   * 상온 테스트용 저비용 시제품인 경우 standard High-Tg FR-4 (Tg >= 170 C)로도 제작 가능
5. 동박 두께: 1 oz (35 um) 외층 및 내층
6. 표면 처리 (Surface Finish): ENIG (무전해 니켈-금도금, Au 두께 >= 0.05 um / 2 u")
   * 중요: 상면 54mm O-링 접지링 및 광다이오드 패드가 금도금 노출면이어야 함
7. 솔더마스크 색상: 무광 블랙 (Matte Black) 또는 녹색 (Green)
8. 실크스크린 색상: 백색 (White)
9. 최소 트레이스/간격: 0.15 mm / 0.15 mm (6 mil / 6 mil)
10. 최소 드릴 홀: 0.3 mm (Ground Fence & Signal Fanout Vias)
```

---

## 3. 드릴 툴 테이블 및 홀 구성 (총 74개 홀)

- **Tool 1 (`T01`, $\varnothing 2.70\,\mathrm{mm}$)**: 4개 — M2.5 체결용 접지 홀 (좌표: $(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)\,\mathrm{mm}$)
- **Tool 2 (`T02`, $\varnothing 0.30\,\mathrm{mm}$)**: 68개 — 54mm Au 접지링 둘레 RF 차폐 비아 펜스(36개) + 16채널 VCSEL ↔ Samtec 내층(`In3_Cu`) 연결 비아(32개)
- **Tool 3 (`T03`, $\varnothing 0.80\,\mathrm{mm}$)**: 2개 — Samtec 고속 커넥터 기구 정합용 가이드 핀 홀 (내층 동박 이격 반영)

---

## 4. 3차 심층 DFM/CAM 감사에서 발견·교정된 핵심 공학 결함 (`verify_gerber.py` & `deep_gerbonara_audit.py`)

기존 2차 감사까지는 파일 파싱과 외곽 바운딩 박스만 통과했으나, 실제 CAM 엔지니어링 및 전기적 연결성(ERC/DRC) 기준으로 전수 재검증하여 다음 **7가지 치명적 제조/회로 결함을 추가로 적발·완전 수정**했습니다:

1. **6층 사양서 대비 4층 거버 누락 불일치 해결**: 사양서는 6층(`6 Layers`)이나 실제 파일은 4층(`F_Cu`, `In1_Cu`, `In2_Cu`, `B_Cu`)만 생성되어 공장 CAM 접수 시 즉시 보류(EQ Hold)되는 문제를 해결하여 `In3_Cu.g3`(내층 스트립라인 배선) 및 `In4_Cu.g4`(2차 차폐 접지면)를 포함한 정식 6층 거버 세트로 완비했습니다.
2. **내층 접지면/전원면 미채움(Unfilled Wireframe) 결함 수정**: 기존 `In1_Cu.g1` 및 `In2_Cu.g2`가 `G36*`/`G37*` 폴리곤 채움 없이 `0.15mm` 외곽선만 그려져 있어 실제 제작 시 접지면·전원면이 빈 공간으로 제작되는 치명적 결함을 RS-274X `G36*`/`G37*` 솔리드 동박 Region 폴리곤으로 수정하고 `gerbonara` `Region` 객체로 검증했습니다.
3. **궤환 저항(`Rf`) 및 Samtec 60핀 커넥터 미결선(Floating Pads) 수정**:
   - 공중에 떠 있던 0402 궤환 저항(`Rf`) 패드를 OPA855 반전 입력(Pin 2) 및 출력(Pin 6)에 직결 배선했습니다.
   - `Y=49.0mm` 허공에서 끊겨 있던 16채널 VCSEL 팬아웃 배선을 비아 및 `In3_Cu.g3` 내층 스트립라인을 통해 Samtec `J1` 커넥터 패드까지 100% 연결했습니다.
   - 단자 1개만 있어 개방 회로(Open Circuit)였던 양/음 InGaAs BPD 어레이를 각각 2단자(애노드/캐소드) 패드 및 $\pm 3.3\,\mathrm{V}$ 역바이어스 레일로 완결했습니다.
4. **SMA 커넥터(`J2`) 중심 신호 핀 솔더마스크 덮임 결함 수정**: `F_Cu.gtl` 및 `F_Mask.gts`의 `(37.5, 1.5) mm` 위치에 50$\Omega$ SMA 중심 신호 런치 패드(`D22`)와 솔더마스크 개구부를 신설하여 납땜 불능 문제를 해결했습니다.
5. **NPTH 가이드 핀 내층 동박 단락 방지**: Samtec 가이드 핀 홀(`T03`, `Y=10.0mm`) 주변으로 `In1_Cu`, `In2_Cu`, `In4_Cu` 솔리드 동박 폴리곤에 이격(Clearance)을 부여했습니다.
6. **KiCad `.kicad_pcb` 파일 내 잘못된 HTML 주석(`<!-- -->`) 제거**: S-Expression 파서 오류를 유발하던 HTML 주석을 전수 제거하고 6층 레이어 정의 및 괄호 균형을 검증했습니다.
7. **`deep_gerbonara_audit.py` 내 형식적 통과(`print("[PASS]")`) 제거**: 실제로 `gerbonara`의 `Arc`, `Region`, `Flash`, `Line` 프리미티브를 순회하여 54mm Au 접지링 외경(`54.00mm` / 마스크 `54.10mm`), SMA 중심 패드 개구, 내층 폴리곤 개수, 48개 스트립라인 세그먼트를 정량 검증하도록 감사 스크립트를 강화했습니다.

---

## 5. 4차 DFM/DRC 정밀 교정 (GPT Codex 레드팀 지적 사항 100% 반영)

외부 감사관(GPT Codex)의 독립 소스코드 감사 결과 지적된 **"비아 절연 및 TIA 핀 간 단락"** 결함을 정밀 분석하여 완전히 해결했습니다:

1. **TIA (OPA855 WSON-8) 핀 간 0.10mm 중첩 쇼트 완전 해소**:
   - 기존 조리개(Aperture 17)가 `R,0.250000X0.600000` (X=0.25mm, Y=0.60mm)로 정의되어, 핀 피치($0.50\,\mathrm{mm}$)보다 패드 높이($0.60\,\mathrm{mm}$)가 커서 인접 핀 간 $0.10\,\mathrm{mm}$ 물리적 단락이 발생했던 것을 **`R,0.500000X0.250000` (X=0.50mm, Y=0.25mm)**로 방향 및 치수를 정정.
   - 핀 간 Y 이격 거리를 **$0.25\,\mathrm{mm}$ ($\ge 0.20\,\mathrm{mm}$ IPC-7351 기준)**로 완벽 확보.
   - 솔더마스크 조리개도 `R,0.600000X0.330000`으로 조정하여 핀 사이에 $0.17\,\mathrm{mm}$의 솔더마스크 댐(Solder Mask Dam)을 형성, 납땜 브릿지 원천 차단.

2. **KCL 버스 및 귀환저항($R_f$) 배선의 핀 1/7/8 관통 쇼트 수정**:
   - 상단에서 핀 2(IN-) 및 핀 6(OUT)으로 진입하던 배선이 핀 1 및 핀 7/8을 직선으로 덮어버리던 결함을 수정.
   - 칩 외곽($X = CX \pm 2.5\,\mathrm{mm}$)을 우회하여 핀 2(Y=23.25) 및 핀 6(Y=22.75)에 **완벽한 수평 측면 진입(Horizontal Side-Entry)** 경로 구축.
   - 핀 1 및 핀 7/8과의 절연 이격 $\ge 0.30\,\mathrm{mm}$ 확보 (Zero Short 달성).

3. **내층 접지면 및 전원면 비아 절연(Antipad) 전수 부여 (`%LPC*%`)**:
   - 솔리드 구리 폴리곤(G36/G37)을 관통하던 비-접속 비아(Signal Vias 32개, Ground Fence Vias 36개, 체결 홀 4개)에 이격이 없어 전원-접지 및 신호-전원이 단락되던 치명적 결함 해소.
   - RS-274X 표준 **`%LPC*%` (Layer Polarity Clear)** 모드를 도입하여:
     - `In1_Cu.g1` (L2 GND): 32개 신호 비아 관통부에 $\varnothing 1.0\,\mathrm{mm}$ 안티패드 32개 펀칭.
     - `In2_Cu.g2` (L3 PWR): 4개 마운팅 홀($\varnothing 4.2\,\mathrm{mm}$) + 36개 접지 펜스 비아($\varnothing 1.0\,\mathrm{mm}$) + 32개 신호 비아($\varnothing 1.0\,\mathrm{mm}$) = 총 72개 안티패드 펀칭 (GND-전원 및 신호-전원 완전 절연).
     - `In4_Cu.g4` (L5 GND): 32개 신호 비아 관통부에 $\varnothing 1.0\,\mathrm{mm}$ 안티패드 32개 펀칭.
   - `deep_gerbonara_audit.py` Section 4 DRC에서 총 136개 안티패드 및 TIA 핀 절연 전수 검증 통과 완료.

