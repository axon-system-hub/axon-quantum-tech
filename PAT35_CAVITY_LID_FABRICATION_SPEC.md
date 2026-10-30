# AXON PAT-35 광 CPNPU 미러 캡(Cavity Lid) 제작 및 발주 사양서

- **문서 번호**: AXON-MECH-SPEC-PAT35-REV-B
- **작성 일자**: 2026-10-31 KST
- **설계 승인**: AXON Sovereign Architecture / Hermes AI EDA Studio
- **첨부 도면**: 
  - DXF CAD 도면: [`AXON_PAT35_CAVITY_LID_REV_B.dxf`](AXON_PAT35_CAVITY_LID_REV_B.dxf)
  - SVG 벡터 도면: [`AXON_PAT35_CAVITY_LID_REV_B.svg`](AXON_PAT35_CAVITY_LID_REV_B.svg)
  - PNG 실측 렌더링: [`AXON_PAT35_CAVITY_LID_REV_B.png`](AXON_PAT35_CAVITY_LID_REV_B.png)

---

## 1. 부품 개요 및 기능

본 부품은 고가의 실리콘 포토닉스(SiPh) 도파로 노광·식각 공정을 대체하여, 기판 상단에서 상용 VCSEL 어레이(1550nm)의 상향 발광을 바닥면의 차동 BPD(수광 다이오드) 어레이로 저손실(-5.5dB 링크 예산) **금속 경면 반사(Metallic Specular Reflection)**시키는 **자유공간 광학 캐비티 챔버 커버(Cavity Lid)**입니다. (유전체 경계면 임계각 현상인 전반사(TIR)와 구별되는 4N 금 박막 경면 반사 방식 적용)

---

## 2. 기구 치수 및 공차 사양 (CAD 도면 기준)

| 측정 항목 | 공칭 치수 (Nominal) | 허용 공차 (Tolerance) | 가공 방식 |
|---|:---:|:---:|---|
| **외형 가로 x 세로** | $58.00 \times 58.00\,\mathrm{mm}$ | $\pm 0.05\,\mathrm{mm}$ | 정밀 CNC 밀링 |
| **외벽 두께 (Rim Width)** | $2.50\,\mathrm{mm}$ | $\pm 0.03\,\mathrm{mm}$ | 정밀 엔드밀 가공 |
| **내부 캐비티 공간** | $53.00 \times 53.00\,\mathrm{mm}$ | $\pm 0.05\,\mathrm{mm}$ | 내부 포켓팅 가공 |
| **캐비티 깊이 (Depth)** | $3.00\,\mathrm{mm}$ | $\pm 0.02\,\mathrm{mm}$ | 바닥면 평탄도 연마 |
| **미러 유효 반사면** | $45.00 \times 45.00\,\mathrm{mm}$ | - | 다이아몬드 플라이커팅 |
| **체결 볼트홀 (4개소)** | $\varnothing 2.50\,\mathrm{mm}$ 관통홀 | $+0.08 / -0.00\,\mathrm{mm}$ | M2/M2.5 볼트 클리어런스 |
| **체결홀 중심 좌표** | $(4.0, 4.0), (54.0, 4.0), (54.0, 54.0), (4.0, 54.0)$ | $\pm 0.02\,\mathrm{mm}$ | 4코너 대칭 위치 |
| **다우얼 핀홀 (2개소)** | $\varnothing 1.50\,\mathrm{mm}$ 리머홀 | $+0.015 / -0.000\,\mathrm{mm}$ | $(10.0, 4.0), (48.0, 54.0)$ 광학 정렬 핀 |

---

## 3. 재질 및 광학 코팅 사양

1. **소재 (Base Material)**:
   - **기본 사양**: AL6061-T6 (초경량 고강도 알루미늄 합금)
   - **극저온 특화 사양 (옵션)**: 무산소동 C10200 (Oxygen-Free Copper, 열전도도 $\ge 390\,\mathrm{W/m\cdot K}$)
2. **내부 반사면 표면 조도**:
   - 캐비티 천장 반사 영역: $Ra \le 0.02\,\mu\mathrm{m}$ (Mirror Finish / Super-Polished)
3. **광학 코팅 (Optical Gold Coating)**:
   - **반사층**: 순금(Au 99.99%) 진공 증착(Thermal Evaporation / Sputtering) $\ge 150\,\mathrm{nm}$
   - **밀착층 (Adhesion layer)**: Ti 또는 Cr $\approx 10\,\mathrm{nm}$
   - **광학 성능**: 파장 $\lambda = 1550\,\mathrm{nm}$ 입사각 $45^\circ$ 기준 **광반사율 $\ge 99.2\%$ 보증**
4. **외면 표면 처리**:
   - 외측 면: 무광 블랙 아노다이징 (산란광 흡수 및 방열 촉진)

---

## 4. 국내 가공소 샘플 발주 가이드

- **발주 수량**: 1차 검증 샘플 3~5개
- **추천 가공처**:
  - 서울 문래동 / 을지로·청계천 정밀 CNC 머시닝 센터 (도면 DXF 파일 직접 전달)
  - 광학 코팅: 부천/안산/시화 정밀 광학 박막 증착 전문 업체
- **예상 제작 비용**:
  - 알루미늄 CNC 가공 3개: 약 60만 ~ 120만 원
  - 광학 금(Au) 증착 배치 1회: 약 80만 ~ 150만 원
  - **총 시제품 조달 비용: 약 150만 ~ 270만 원 선** (수십억 원 파운드리 마스크 NRE 대비 99.9% 절감)

