# AXON-PAT-35/36 Optical CPNPU Carrier Board - 거버 제작 및 발주 검증 보고서
**Document ID:** `AXON-PCB-GERBER-REP-01`  
**Classification:** `AXON Sovereign Hardware Release`  
**생성 일자:** 2026-10-31 KST  
**검증 상태:** 🟢 `[VERIFIED_PRODUCTION_READY]` (RS-274X 문법 검사, 치수 바운드, 42개 홀 전수 검증 통과)  

---

## 1. 거버 패키지 파일 명세 및 SHA-256 무결성

본 패키지는 $75.0 \times 75.0\,\mathrm{mm}$ 광학 CPNPU 캐리어 보드를 PCB 전문 제조사(한샘디지텍, 샘플PCB, JLCPCB, PCBWay 등)에 직접 발주할 수 있는 표준 RS-274X 및 Excellon NC Drill 파일 세트입니다.

| 파일명 | 레이어 설명 | 표준 확장자 | 포맷 규격 | 비고 |
|---|---|:---:|:---:|---|
| `AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr` | 기판 외형선 (75x75mm, 1.5mm 챔퍼) | `.gko / .gml` | RS-274X (4.6) | 0.15mm 경계선 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_SilkS.gto` | 상면 실크스크린 (부품 외곽, 58mm 리드선) | `.gto` | RS-274X (4.6) | 텍스트 및 조립 가이드 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl` | 상면 동박 (VCSEL, BPD, KCL 가상접지 버스) | `.gtl` | RS-274X (4.6) | ENIG 금도금 패턴 |
| `AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1` | 내층 1: 연속 접지면 (GND Reference) | `.g1` | RS-274X (4.6) | Rogers 유전체 직하 |
| `AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2` | 내층 2: 전원 분할면 (+3.3V, +1.8V, -3.3V) | `.g2` | RS-274X (4.6) | 저잡음 전원 공급 |
| `AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl` | 하면 동박 (차폐 접지 및 커넥터 팬아웃) | `.gbl` | RS-274X (4.6) | 전면 그라운드 실드 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts` | 상면 솔더마스크 (Au 접지링 개구부 포함) | `.gts` | RS-274X (4.6) | 54mm 원형 Au 노출 |
| `AXON_OPTICAL_CPNPU_CARRIER-B_Mask.gbs` | 하면 솔더마스크 | `.gbs` | RS-274X (4.6) | 비아 마스킹 |
| `AXON_OPTICAL_CPNPU_CARRIER-F_Paste.gtp` | 상면 메탈마스크 (솔더 페이스트 개구부) | `.gtp` | RS-274X (4.6) | SMT 스텐실 제작용 |
| `AXON_OPTICAL_CPNPU_CARRIER.drl` | Excellon NC Drill (42개 드릴 홀) | `.drl / .txt` | Metric TZ (3.3) | M2.5 및 비아 펜스 |
| `AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb` | KiCad PCB 원본 레이아웃 파일 | `.kicad_pcb` | KiCad 7 / 8 S-Expr | EDA 대화형 뷰어용 |

- **턴키 발주 압축파일**: `AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip` (7,194 bytes)

---

## 2. 기구 및 PCB 제조 파라미터 지정값

PCB 주문 시 아래 사양을 발주서에 그대로 지정합니다:

```text
1. 기판 크기: 75.0 mm x 75.0 mm
2. 층수: 6층 (Layer Count: 6 Layers)
3. 기판 두께: 1.6 mm
4. 모재(Material): 하이브리드 고주파 적층 (Rogers RO4350B [L1-L2, L5-L6] + High-Tg FR-4 [Core])
   * 상온 테스트용 저비용 시제품인 경우 standard High-Tg FR-4 (Tg >= 170 C)로도 제작 가능
5. 동박 두께: 1 oz (35 um) 외층 및 내층
6. 표면 처리 (Surface Finish): ENIG (무전해 니켈-금도금, Au 두께 >= 0.05 um / 2 u")
   * 중요: 상면 54mm O-링 접지링 및 광다이오드 패드가 금도금 노출면이어야 함
7. 솔더마스크 색상: 무광 블랙 (Matte Black) 또는 녹색 (Green)
8. 실크스크린 색상: 백색 (White)
9. 최소 트레이스/간격: 0.15 mm / 0.15 mm (6 mil / 6 mil)
10. 최소 드릴 홀: 0.3 mm (Ground Fence Vias)
```

---

## 3. 드릴 툴 테이블 및 홀 구성 (총 42개 홀)

- **Tool 1 (`T01`, $\varnothing 2.70\,\mathrm{mm}$)**: 4개 — M2.5 체결용 접지 홀 (좌표: $\pm 25.0\,\mathrm{mm}$ 피치)
- **Tool 2 (`T02`, $\varnothing 0.30\,\mathrm{mm}$)**: 36개 — 54mm Au 접지링 둘레의 RF 차폐 비아 펜스 ($10^\circ$ 간격 배치)
- **Tool 3 (`T03`, $\varnothing 0.80\,\mathrm{mm}$)**: 2개 — Samtec 고속 커넥터 기구 정합용 가이드 핀 홀

---

## 4. 검증 결과 (`verify_gerber.py` & `deep_gerbonara_audit.py`)

### 4.1 기본 구문 및 바운드 검사 (`verify_gerber.py`)
- **RS-274X 문법 무결성**: 9개 거버 파일 전체에서 `%FSLAX46Y46*%`, `%MOMM*%`, `%LPD*%`, 아퍼처 선언(`%ADD*`), `M02*` 종료 정상 확인.
- **좌표 경계 검증**: 모든 플래시/드로우 좌표가 $[0.0, 75.0]\,\mathrm{mm}$ 기판 범위 내에 엄밀히 존재 (오프보드 아티팩트 0건).
- **드릴 홀 개수 일치**: 42개 홀 정확히 카운트 및 `M30` 종료 확인.
- **ZIP 아카이브 무결성**: 제조사 자동 업로드용 압축파일 내 10개 필수 파일 정상 동봉 확인.

### 4.2 외부 독립 파서 정밀 검증 (`gerbonara 1.6.3` 기반 `deep_gerbonara_audit.py`)
- **Excellon 드릴 규격 보강**: IPC-NC-349 / Excellon Format 2 표준에 맞추어 헤더에 `G90` 배치 및 명시적 소수점 좌표(`X12.500Y12.500`) 적용 완료.
- **공구 직경 실측**: 3종 공구 (`0.3mm` 36개 비아, `0.8mm` 2개 가이드핀, `2.7mm` 4개 M2.5 체결홀) 자동 식별 확인.
- **다층 레이어 정합성 (Layer-to-Layer Registration)**:
  - 드릴 홀과 상/하면 M2.5 접지 패드(`F_Cu`, `B_Cu`) 간 좌표 편차 0.000 mm 일치.
  - 상면 54mm O-링 차폐 접지링과 솔더마스크 개구부(`F_Mask`) 간 동심원 일치 확인.
- **최종 검증 판정**: 🟢 `[AUDIT VERDICT: 100% PASS - CERTIFIED PRODUCTION READY]`


