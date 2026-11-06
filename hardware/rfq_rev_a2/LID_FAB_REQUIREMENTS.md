# Cavity lid Rev C — controlled machining RFQ

Date: 2026-11-01 KST. Quantity 3 / 5. Primary quote AL6061-T6 for a 300 K
prototype; optional C10200 OFHC copper separately. The Rev C drawing and these
requirements supersede all Rev B cavity descriptions for this RFQ.

## Datums and dimensions

- Units mm. Datum A = PCB-facing seal land; datum B/C = two adjacent external edges.
- Outside 58.00 x 58.00 +/-0.05; overall thickness 5.00 +/-0.03.
- Pocket: **circular diameter 50.00 +/-0.05**, centered (29.00,29.00),
  depth 3.50 +/-0.02 from datum A; roof nominal 1.50.
- Seal groove: ID 51.50, OD 54.00, width 1.25 +/-0.03,
  depth 0.80 +/-0.03, concentric with pocket within 0.05.
- Four diameter 2.70 +0.10/-0.00 through holes at (4,4), (54,4),
  (54,54), (4,54); positional tolerance diameter 0.10 relative B/C.
  No tapped holes and no alignment dowels in this revision.
- Datum A flatness 0.03; sealing lands Ra <=0.4 um.
- PCB lower-left is (0,0); lid lower-left is (8.50,8.50) in PCB coordinates.
  The four holes therefore coincide with PCB (12.5,12.5), (62.5,12.5),
  (62.5,62.5), (12.5,62.5). PCB and lid both use the same 50 mm hole pitch.
- Relieve the PCB-facing area **outside diameter 55**, except four diameter 5
  mounting bosses, by 0.25 +0.05/-0.00 from datum A. The retained annular land
  and mounting bosses may contact GND; other underside areas must clear PCB
  signal copper. Vendor must return a shaded relief drawing before machining.
- No substitute 45 mm square pocket: its corners would cut through the circular
  gasket. No 53 mm square pocket or Rev B dowel pattern is authorized.
- Internal corner relief is not relevant to the round pocket; deburr exterior
  edges 0.1-0.2 without rounding sealing edges into the gasket groove.

## Surface and coating quote

Pocket floor: mirror finish target Ra <=0.02 um, measured at center and four
quadrants. Quote the achievable roughness and instrument bandwidth. Coating:
Ti or Cr adhesion 10 +/-2 nm, Au 150 +/-10 nm, optional SiO2 protection
80 +/-5 nm as a separate alternative. Select the final coating stack from
vendor witness-coupon reflectance at 1550 nm and application angle; do not assume
the dielectric cap increases reflectance. Target measured reflectance >=98.5%
at 1550 nm, report angle/polarization and uncertainty. State deviations in quote.

Mask the seal land and bolt contact bosses against insulating protective
coatings; preserve a defined conductive contact. No blanket anodizing or SiO2
on GND contacts. Black exterior coating is optional and must be masked away
from electrical and sealing lands.

For a circular diameter 50 mm floor, 150 nm Au at density 19.32 g/cm3 gives
about **5.69 mg** of Au on the floor alone. This is a geometric material estimate,
not coating utilization, price or a measured deposition weight.

## Seal and inspection

For the 300 K prototype, quote a supplier-selected **1.00 mm cord custom ring**
matched to the 52.75 mm groove centerline diameter. Nominal gland height 0.80 mm
suggests 20% cord squeeze; tolerances, cord area fill, stretch and bolt preload
must be checked by the seal supplier. Do not call it AS568-032 without a verified
dimensional match. No standard elastomer is asserted suitable at 77 K.
Quote a cryogenic metal/indium seal alternative only with a supplier-proposed
groove and preload, released as a later drawing revision.

Return CMM dimensions, five-point surface roughness, coating thickness witness,
reflectance report and proposed cleaning/packing method. Leak rate, pressure
differential, helium test method and outgassing acceptance are engineering
decisions to agree before any hermetic qualification order. The present RFQ
does not declare a leak-tight or pressure-rated assembly.

---

## Addendum (2026-11-06): Optical Ring Facet Geometry, RMS Scatter ($R_q$), and 4N/6N/Dielectric Coupon Protocol

Before ordering tight-tolerance multi-bounce cavities, the following drawing and metrology requirements apply to reconcile the baseline Rev C floor RFQ with the 77K 4-bounce ($45^\circ$) optical ring model:

1. **Four $45^\circ$ Reflection Facets vs. Cylindrical Sidewall Astigmatism:**
   - Although a zero-width central ray can reflect at $45^\circ$ off four points on a $\varnothing 50.00\,\mathrm{mm}$ circle, a finite-width beam reflecting off a curved cylindrical sidewall ($R = 25.00\,\mathrm{mm}$) experiences severe tangential focusing/astigmatism ($f_t = \frac{R\cos 45^\circ}{2} \approx 8.839\,\mathrm{mm}$).
   - For any lateral 4-bounce ring configuration, the CAD drawing must explicitly define **four flat reflection surfaces** (either machined flat chord facets or mounted flat mirror inserts) with specified **position, surface normal vector ($\hat{n}_i$), clear aperture, surface figure error (PV flatness), and beam waist clearance**, and recalculate the resulting exact optical path length $L_{\text{path}}$.

2. **Post-Coating RMS Microroughness ($R_q$) and Total Integrated Scatter (TIS) Budget:**
   - Arithmetic roughness $R_a \le 20\,\mathrm{nm}$ in the baseline RFQ is not equivalent to optical RMS microroughness $R_q$. Under the smooth-surface approximation $\mathrm{TIS} \approx \left(\frac{4\pi R_q \cos\theta_i}{\lambda}\right)^2$ at $\lambda = 1550\,\mathrm{nm}, \theta_i = 45^\circ$:
     - $R_q = 20.0\,\mathrm{nm} \implies \mathrm{TIS} \approx \mathbf{1.315\%}$ ($13,146\,\mathrm{ppm}$) scatter loss per bounce.
     - For a $\le 500\,\mathrm{ppm}$ scatter allocation per bounce: **$R_q \le 3.90\,\mathrm{nm}$**.
     - For a $\le 100\,\mathrm{ppm}$ scatter allocation per bounce: **$R_q \le 1.74\,\mathrm{nm}$** (super-polished optics regime).
   - Therefore, quotes for multi-bounce optical cavities must report **post-coating RMS roughness $R_q$ together with the spatial-frequency measurement bandwidth (e.g., white-light interferometry / AFM band), surface figure error, and directly measured specular reflectance** at the operating acceptance angle.

3. **6N Purity Lot Traceability vs. Thin-Film Coupon A/B Qualification:**
   - Gold raw material purity (4N vs. 6N 99.9999%) must be tracked via supplier Certificate of Analysis (CoA) and deposition batch logs (deposition rate, base pressure, substrate temperature, thickness $\ge 200\,\mathrm{nm}$), while **final acceptance is determined strictly by the measured optical performance of the finished coating**.
   - **Controlled Witness Coupon Protocol:** Fabricate **4N Au and 6N Au witness coupons on identical substrate finishes and film stacks**, alongside a **reference low-loss dielectric HR mirror coupon**, and measure specular reflectance at $1310\,\mathrm{nm}$ and $1550\,\mathrm{nm}$, $\theta_i = 45^\circ$, s- and p-polarization at both **300K and 77K (before and after liquid-nitrogen thermal cycling)**.
   - Because sidewall vapor incidence inside a recessed pocket differs from flat witness coupons, **per-lap circulation loss must be measured separately on the final assembled lid**.

4. **End-to-End Latency Driven Loss-per-Bounce Ordering Grade:**
   - Mirror-only 99% survival requires total per-bounce loss $\le \mathbf{1,256\,\mathrm{ppm}}$ for 8 bounces ($0.91\,\mathrm{ns}$, 2 laps) and $\le \mathbf{502\,\mathrm{ppm}}$ for 20 bounces ($2.06\,\mathrm{ns}$, 5 laps).
   - End-to-end latency from detector through TIA, decoder, driver, and EOM must be measured in parallel to fix the required lap count before selecting the machining and coating grade.
