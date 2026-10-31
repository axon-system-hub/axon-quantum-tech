# AXON-PAT-35/36 Optical CPNPU Carrier Baseboard PCB Specification
**Document ID:** `AXON-HW-PCB-SPEC-REV-A1`  
**Classification:** `AXON Sovereign Hardware Specification`  
**Target Mating Component:** `AXON_PAT35_CAVITY_LID_REV_B` ($58.0 \times 58.0\,\mathrm{mm}$ Au Cavity Lid)  
**Status:** 🟢 `[DESIGN_VERIFIED]`  

---

## 1. 개요 및 설계 목적

본 규격서는 **AXON-PAT-35/36 1550nm Cavity Li-Fi 0-MUL 광학 CPNPU**를 실리콘/광학 소자 레벨에서 실장하고, $58.0 \times 58.0\,\mathrm{mm}$ 금 반사형 캐비티 덮개(Lid)와 기밀(Hermetic) 체결되는 **고속 캐리어 베이스보드 PCB(Carrier Baseboard PCB)**의 하드웨어 제작 사양서이다.

- **광학 MAC 연산 원리**: 16개 독립 파장/공간 채널의 1550nm VCSEL 광원 배열에서 방출된 광신호가 상부 150nm 순금(4N 99.99%) 거울면에서 반사되어 하부 수신단 1x16 InGaAs 균형 광다이오드(BPD) 선형 어레이로 입사.
- **KCL 0-지연 아날로그 가산**: 광다이오드 캐소드/애노드 접합점에서 키르히호프 전류 법칙(KCL)에 의해 직접 차동 감산 및 가산 수행 ($I_{diff} = \sum I^+ - \sum I^-$), 디지털 곱셈기/가산기 없이 광속 및 전하 이동 속도(약 5.8 ps)로 MAC 연산 완료.

---

## 2. PCB 기계적 치수 및 기구 결합 사양

| 항목 | 사양치 | 공차 | 비고 |
|---|---|---|---|
| 외형 치수 (Board Size) | $75.0 \times 75.0\,\mathrm{mm}$ | $\pm 0.1\,\mathrm{mm}$ | 사각 엣지 베벨링 가공 |
| 기판 두께 (Total Thickness) | $1.6\,\mathrm{mm}$ | $\pm 10\%$ | 6층 다층 고주파 하이브리드 적층 |
| 캐비티 리드 안착 영역 | $58.0 \times 58.0\,\mathrm{mm}$ (중앙 배치) | $\pm 0.05\,\mathrm{mm}$ | Au 도금 접지 링(Ground Ring) 구비 |
| 체결 홀 (Mounting Holes) | 4개 $\times \varnothing 2.7\,\mathrm{mm}$ (M2.5 볼트용) | $\pm 0.05\,\mathrm{mm}$ | 피치: $50.0 \times 50.0\,\mathrm{mm}$ (정사각형) |
| O-링 기밀 패킹 접촉면 | 폭 $2.5\,\mathrm{mm}$, 외경 $54.0\,\mathrm{mm}$ | $\pm 0.05\,\mathrm{mm}$ | 동박 노출 후 무전해 니켈-금도금(ENIG) |
| 표면 조도 (Cavity Contact) | $Ra \le 0.4\,\mu\mathrm{m}$ | - | 솔더레지스트 없는 무전해 금도금 영역 |

---

## 3. 고주파 PCB 층 구성 (6-Layer Hybrid Stackup)

1550nm 고속 레이저 다이오드 변조 신호(최대 10 GHz/lane) 및 고감도 차동 전류 전송을 위해 저손실 고주파 유전체와 FR-4의 하이브리드 적층을 채택한다.

```text
[L1 Top: Signal]   35um Cu (ENIG 금도금) : 광소자(VCSEL, InGaAs BPD) 실장, KCL 아날로그 합산 버스
  ---------------- Rogers RO4350B 코어 (두께 0.101mm, Dk=3.48, Df=0.0037)
[L2 Inner 1: GND]  35um Cu : 연속 접지면 (Continuous Ground Reference Plane)
  ---------------- FR-4 Prepreg 2116 (두께 0.150mm, Dk=4.2)
[L3 Inner 2: SIG]  35um Cu : 저속 디지털 제어선 및 온도 모니터링선
  ---------------- FR-4 Core (두께 0.800mm)
[L4 Inner 3: PWR]  35um Cu : 전원 분할 플레인 (+3.3V, +1.8V, -5.0V BPD 역바이어스)
  ---------------- FR-4 Prepreg 2116 (두께 0.150mm)
[L5 Inner 4: GND]  35um Cu : 보조 차폐 접지면
  ---------------- Rogers RO4350B 코어 (두께 0.101mm)
[L6 Bot: Signal]   35um Cu : 고속 FMC 커넥터 및 FPGA/ASIC 디지털 인터페이스
```

---

## 4. 광학 송수신부 소자 배치 및 부품표 (BOM)

### 4.1 광학 송신부 (Transmitter, TX)
- **광원**: 16-채널 1550nm VCSEL 다이 어레이 (250um 채널 피치)
- **대체/호환 소자**: Vertilas VL-1550-10G 어레이 또는 II-VI/Coherent 1550nm Datacom 어레이
- **구동 방식**: LVDS/CML 차동 드라이버 (TI ONET1151L 또는 ADI MAX3946)
- **실장 방식**: 와이어본딩(Wire-bonding) 또는 초소형 BGA 플립칩

### 4.2 광학 수신부 (Receiver, RX)
- **수신 소자**: 2x 1x16 InGaAs 균형 광다이오드(BPD) 선형 어레이 (총 32개 포토다이오드)
  - 16개 (+)극 가산 채널 어레이
  - 16개 (-)극 감산 채널 어레이
- **호환 칩**: Hamamatsu G11193 시리즈, Albis Optoelectronics PD 어레이, 또는 국내 우리로(Wooriiro) 광다이오드 칩
- **암전류(Dark Current)**: $I_d \le 0.5\,\mathrm{nA}$ @ $V_R = 5\,\mathrm{V}$
- **차단 주파수(Cutoff Freq)**: $f_{-3\mathrm{dB}} \ge 8.0\,\mathrm{GHz}$

### 4.3 아날로그 전치 증폭부 (Analog Front-End, AFE)
- **트랜스임피던스 증폭기(TIA)**: TI OPA855 (GBW 8 GHz, 초저잡음 $0.98\,\mathrm{nV/\sqrt{Hz}}$) 또는 AD8304
- **귀환 저항($R_f$)**: $1.0\,\mathrm{k\Omega}$ (0.1% 정밀 박막 저항, 0402)
- **대역폭**: DC ~ 2.5 GHz (단일 펄스 응답 시간 $< 140\,\mathrm{ps}$)

### 4.4 시스템 인터페이스
- **디지털 버스 커넥터**: Samtec QSH-030-01-L-D-A (고속差動 100-ohm, DC ~ 14 GHz) 또는 FMC HPC 커넥터
- **온도 제어**: TEC(Thermoelectric Cooler) 접촉면 및 10k NTC 서미스터 실장

---

## 5. KCL 아날로그 합산 버스 배선 규칙 (Routing Invariant)

1. **대칭 차동 라우팅 (Strict Differential Symmetry)**:
   - 16개 (+) 채널과 16개 (-) 채널의 포토다이오드 캐소드/애노드 라우팅 길이는 $\pm 0.1\,\mathrm{mm}$ 이내로 등장 배선(Length-matched)되어야 한다.
   - 불균일 위상차에 의한 아날로그 가산 왜곡을 $5\,\mathrm{ps}$ 이내로 차단한다.
2. **기생 커패시턴스 최소화**:
   - TIA 입력 노드의 동박 면적을 최소화하여 기생 커패시턴스 $C_{stray} < 0.2\,\mathrm{pF}$ 유지.
3. **Au 반사 캐비티 접지 (Faraday Cage Effect)**:
   - 상부 캐비티 리드의 외곽 볼트 체결부는 PCB L2 GND 플레인과 비아 어레이(Via Fence, $1.0\,\mathrm{mm}$ 피치)로 완전히 본딩되어 외부 RF 노이즈를 60 dB 이상 차폐한다.

---

## 6. 국내 샘플 발주 및 조립 가이드

- **PCB 제작 업체**: 한샘디지텍(Hansaem), 인터플렉스, 또는 샘플PCB (4~6층 Rogers 하이브리드 지정)
- **광학 소자 SMT/와이어본딩**: 성남/가산 하이브리드 마이크로패키징 전문 센터 (칩마운트 및 Au 와이어본딩 25um 직경)
- **예상 제작 소요 기간**: PCB 4일 + 부품 수급 1~2주 + 패키징 3일 = 총 2~3주
- **예상 시제품 견적 (3~5장 기준)**: PCB 기판 80만~120만 원, 광다이오드/드라이버 실장 150만~250만 원.
