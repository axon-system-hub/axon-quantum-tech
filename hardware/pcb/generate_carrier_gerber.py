#!/usr/bin/env python3
"""
AXON-PAT-35/36 Optical CPNPU Carrier Baseboard PCB Gerber & KiCad Generator
Generates full 6-Layer RS-274X Gerber layer files, IPC-NC-349 Excellon Drill file,
and valid S-Expression KiCad PCB file with complete electrical connectivity and solid plane fills.
"""

import math
import os
import zipfile

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
GERBER_DIR = os.path.join(OUT_DIR, "gerber_files")
os.makedirs(GERBER_DIR, exist_ok=True)

BOARD_W = 75.0
BOARD_H = 75.0
CX = BOARD_W / 2.0  # 37.5 mm
CY = BOARD_H / 2.0  # 37.5 mm


def fmt_coord(mm_val):
    """Format mm value to RS-274X 4.6 coordinate integer string"""
    val_int = int(round(mm_val * 1000000))
    return str(val_int)


def fmt_drill(mm_val):
    """Format mm value to Excellon explicit decimal format (e.g. 12.500)"""
    return f"{mm_val:.3f}"


def make_header(layer_name, apertures):
    lines = [
        "G04 AXON Sovereign Hardware - Optical CPNPU Carrier Board*",
        f"G04 Layer: {layer_name}*",
        "%FSLAX46Y46*%",
        "%MOMM*%",
        "%LPD*%",
    ]
    for d_code, ap_def in apertures.items():
        lines.append(f"%ADD{d_code}{ap_def}*%")
    lines.append("G75*")  # Multi-quadrant arc mode
    lines.append("G01*")  # Linear interpolation
    return lines


def emit_rect_region(lines, x0, y0, x1, y1):
    """Emit a solid filled RS-274X copper polygon region (G36 / G37)."""
    lines.append("G36*")
    lines.append(f"X{fmt_coord(x0)}Y{fmt_coord(y0)}D02*")
    lines.append(f"X{fmt_coord(x1)}Y{fmt_coord(y0)}D01*")
    lines.append(f"X{fmt_coord(x1)}Y{fmt_coord(y1)}D01*")
    lines.append(f"X{fmt_coord(x0)}Y{fmt_coord(y1)}D01*")
    lines.append(f"X{fmt_coord(x0)}Y{fmt_coord(y0)}D01*")
    lines.append("G37*")


# -----------------------------------------------------------------------------
# 1. Edge.Cuts (Board Outline)
# -----------------------------------------------------------------------------
def gen_edge_cuts():
    apertures = {10: "C,0.150000"}  # 0.15mm line
    lines = make_header("Edge.Cuts (Board Outline)", apertures)
    lines.append("D10*")

    # 75 x 75 mm rectangle with 1.5mm corner chamfers
    ch = 1.5
    pts = [
        (ch, 0.0),
        (BOARD_W - ch, 0.0),
        (BOARD_W, ch),
        (BOARD_W, BOARD_H - ch),
        (BOARD_W - ch, BOARD_H),
        (ch, BOARD_H),
        (0.0, BOARD_H - ch),
        (0.0, ch),
        (ch, 0.0),
    ]

    lines.append(f"X{fmt_coord(pts[0][0])}Y{fmt_coord(pts[0][1])}D02*")
    for p in pts[1:]:
        lines.append(f"X{fmt_coord(p[0])}Y{fmt_coord(p[1])}D01*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 2. F.SilkS (Top Silkscreen)
# -----------------------------------------------------------------------------
def gen_top_silkscreen():
    apertures = {
        10: "C,0.150000",  # Silkscreen line width
        11: "C,0.250000",
    }
    lines = make_header("F.SilkS (Top Silkscreen)", apertures)
    lines.append("D10*")

    # 1. 58 x 58 mm Cavity Lid Outline (centered at CX, CY)
    lid_x0, lid_y0 = CX - 29.0, CY - 29.0
    lid_x1, lid_y1 = CX + 29.0, CY + 29.0
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y0)}D02*")
    lines.append(f"X{fmt_coord(lid_x1)}Y{fmt_coord(lid_y0)}D01*")
    lines.append(f"X{fmt_coord(lid_x1)}Y{fmt_coord(lid_y1)}D01*")
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y1)}D01*")
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y0)}D01*")

    # 2. 45 x 45 mm Optical Reflection Pocket Boundary
    pkt_x0, pkt_y0 = CX - 22.5, CY - 22.5
    pkt_x1, pkt_y1 = CX + 22.5, CY + 22.5
    lines.append(f"X{fmt_coord(pkt_x0)}Y{fmt_coord(pkt_y0)}D02*")
    lines.append(f"X{fmt_coord(pkt_x1)}Y{fmt_coord(pkt_y0)}D01*")
    lines.append(f"X{fmt_coord(pkt_x1)}Y{fmt_coord(pkt_y1)}D01*")
    lines.append(f"X{fmt_coord(pkt_x0)}Y{fmt_coord(pkt_y1)}D01*")
    lines.append(f"X{fmt_coord(pkt_x0)}Y{fmt_coord(pkt_y0)}D01*")

    # 3. Component Outlines & Reference Markings
    # U1 (TIA OPA855) outline at (CX, 23.0)
    lines.append(f"X{fmt_coord(CX-1.5)}Y{fmt_coord(21.5)}D02*")
    lines.append(f"X{fmt_coord(CX+1.5)}Y{fmt_coord(21.5)}D01*")
    lines.append(f"X{fmt_coord(CX+1.5)}Y{fmt_coord(24.5)}D01*")
    lines.append(f"X{fmt_coord(CX-1.5)}Y{fmt_coord(24.5)}D01*")
    lines.append(f"X{fmt_coord(CX-1.5)}Y{fmt_coord(21.5)}D01*")

    # J1 (Samtec 60-pin) outline at (CX, 10.0)
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(8.0)}D02*")
    lines.append(f"X{fmt_coord(CX+10.0)}Y{fmt_coord(8.0)}D01*")
    lines.append(f"X{fmt_coord(CX+10.0)}Y{fmt_coord(12.0)}D01*")
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(12.0)}D01*")
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(8.0)}D01*")

    # VCSEL Array Outline at Y=44.0
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(42.5)}D02*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(42.5)}D01*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(45.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(45.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(42.5)}D01*")

    # InGaAs BPD Array Outline at Y=32.0
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(29.2)}D02*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(29.2)}D01*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(34.8)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(34.8)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(29.2)}D01*")

    # M2.5 Mounting Hole circles
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        r = 3.0
        lines.append(f"X{fmt_coord(hx+r)}Y{fmt_coord(hy)}D02*")
        lines.append("G03*")
        lines.append(f"X{fmt_coord(hx+r)}Y{fmt_coord(hy)}I{fmt_coord(-r)}J0D01*")
        lines.append("G01*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 3. F.Cu (Layer 1: Top Copper - RF / Optical / KCL Analog Core)
# -----------------------------------------------------------------------------
def gen_top_copper():
    apertures = {
        10: "C,0.150000",   # 0.15mm signal trace
        11: "C,0.250000",   # 0.25mm KCL summing & bias bus trace
        12: "C,0.350000",   # 0.35mm 50-ohm RF coplanar trace
        13: "C,1.250000",   # 1.25mm circular annular ring stroke (54mm OD / 51.5mm ID)
        14: "C,5.000000",   # 5.0mm M2.5 mounting pad
        15: "C,0.600000",   # 0.6mm via pad (0.3mm drill)
        16: "R,0.150000X0.350000",  # VCSEL / BPD micro bond pad
        17: "R,0.500000X0.250000",  # WSON-8 pin pad (X=0.50mm, Y=0.25mm, pitch 0.50mm)
        18: "R,0.900000X1.200000",  # WSON-8 thermal exposed pad (X=0.90mm, Y=1.20mm)
        19: "R,0.600000X0.500000",  # 0402 passive pad (X=0.60mm, Y=0.50mm)
        20: "R,0.300000X1.500000",  # Samtec QSH connector pin pad
        21: "R,1.500000X4.000000",  # SMA RF connector ground launch pad
        22: "R,0.600000X2.500000",  # SMA RF connector 50-ohm center signal launch pad
    }
    lines = make_header("F.Cu (L1 Top Copper)", apertures)

    # 1. M2.5 Mounting Pads (4 corners)
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # 2. O-Ring / Faraday Shield Continuous Ground Ring (Radius 26.375 mm, Width 1.25 mm)
    lines.append("D13*")
    r_ring = 26.375
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}D02*")
    lines.append("G03*")
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}I{fmt_coord(-r_ring)}J0D01*")
    lines.append("G01*")

    # 3. Via fence along ground ring (36 vias at 10-deg intervals)
    lines.append("D15*")
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(vy)}D03*")

    # 4. 16-channel VCSEL Transmitter Array (Anode pads at Y=44.0, Common Cathode GND pads at Y=43.2)
    lines.append("D16*")
    pitch = 0.25
    x_start = CX - (15 * pitch) / 2.0  # 35.625 mm
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D03*")  # VCSEL Anode
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(43.2)}D03*")  # VCSEL Cathode (GND)

    # Common Cathode GND bus bar at Y=43.2 with 2 GND vias
    lines.append("D11*")
    lines.append(f"X{fmt_coord(x_start - 0.8)}Y{fmt_coord(43.2)}D02*")
    lines.append(f"X{fmt_coord(x_start + 15*pitch + 0.8)}Y{fmt_coord(43.2)}D01*")

    # VCSEL anode fanout traces to 16 interlayer vias at Y=49.0 (routed on In3.Cu to Samtec J1)
    lines.append("D10*")
    for i in range(16):
        px = x_start + i * pitch
        vx = CX - 7.5 + i * 1.0
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D02*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(45.5 + (i%4)*0.3)}D01*")
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(49.0)}D01*")

    lines.append("D15*")
    for i in range(16):
        vx = CX - 7.5 + i * 1.0
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(49.0)}D03*")

    # 5. 2x 1x16 InGaAs Balanced Photodiode (BPD) Array Pads (2 terminals per photodiode)
    # Positive BPD: Cathode bias (+3.3V) at Y=34.0, Anode summing output at Y=33.0
    # Negative BPD: Cathode summing output at Y=31.0, Anode bias (-3.3V) at Y=30.0
    lines.append("D16*")
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(34.0)}D03*")  # +BPD Cathode (+3.3V bias)
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")  # +BPD Anode (KCL sum)
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")  # -BPD Cathode (KCL sum)
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(30.0)}D03*")  # -BPD Anode (-3.3V bias)

    # +3.3V Bias Rail at Y=34.0 & -3.3V Bias Rail at Y=30.0
    lines.append("D11*")
    lines.append(f"X{fmt_coord(x_start)}Y{fmt_coord(34.0)}D02*")
    lines.append(f"X{fmt_coord(x_start + 15*pitch)}Y{fmt_coord(34.0)}D01*")
    lines.append(f"X{fmt_coord(x_start)}Y{fmt_coord(30.0)}D02*")
    lines.append(f"X{fmt_coord(x_start + 15*pitch)}Y{fmt_coord(30.0)}D01*")

    # 6. KCL Summing Analog Virtual Ground Bus (Y=32.0)
    lines.append(f"X{fmt_coord(x_start)}Y{fmt_coord(32.0)}D02*")
    lines.append(f"X{fmt_coord(x_start + 15*pitch)}Y{fmt_coord(32.0)}D01*")
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D02*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D01*")

    # KCL Bus Feed directly to TIA U1 Inverting Input Pin 2 at (CX - 0.95, 23.25)
    # Routes down outside WSON-8 envelope (X = CX - 2.5) to avoid crossing Pin 1 (at Y=23.75)
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(32.0)}D02*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(28.0)}D01*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(25.5)}D01*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(23.25)}D01*")
    lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(23.25)}D01*")

    # 7. TIA U1 (OPA855 WSON-8) Footprint at (CX, 23.0)
    lines.append("D18*")  # Thermal pad
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")

    lines.append("D17*")  # 8 pins (4 on left, 4 on right, pitch 0.5mm)
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # Feedback Resistor Rf (0402) pads at (CX - 0.8, 26.5) and (CX + 0.8, 26.5)
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(26.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.8)}Y{fmt_coord(26.5)}D03*")

    # Connect Rf pads cleanly around U1 perimeter:
    # Left pad to Pin 2: horizontally left to (CX - 2.5, 26.5), down to (CX - 2.5, 23.25), then into Pin 2
    # Right pad to Pin 6: horizontally right to (CX + 2.5, 26.5), down to (CX + 2.5, 22.75), then into Pin 6
    lines.append("D10*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(26.5)}D02*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(26.5)}D01*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(23.25)}D01*")

    lines.append(f"X{fmt_coord(CX + 0.8)}Y{fmt_coord(26.5)}D02*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(26.5)}D01*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(22.75)}D01*")
    lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(22.75)}D01*")

    # 8. High-Speed 50-ohm RF Coplanar Waveguide Output from Pin 6 node (CX + 2.5, 22.75) to SMA J2 Launch
    lines.append("D12*")  # 0.35mm 50-ohm trace
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(22.75)}D02*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(16.0)}D01*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(13.5)}D01*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(1.5)}D01*")

    # SMA Edge Launch Connector J2 at (CX, 1.5): Center Signal Pad (D22) + Ground Pads (D21)
    lines.append("D22*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(1.5)}D03*")
    lines.append("D21*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(2.0)}D03*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(2.0)}D03*")

    # 9. Samtec QSH 60-pin Connector Footprint at (CX, 10.0) + Fanout Vias at Y=12.4
    lines.append("D20*")
    qsh_x0 = CX - 7.25
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    # Connect first 16 top-row Samtec pins (Y=11.0) to interlayer vias at Y=12.4
    lines.append("D15*")
    for i in range(16):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(12.4)}D03*")
    lines.append("D10*")
    for i in range(16):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D02*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(12.4)}D01*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 4. In1.Cu (Layer 2: Solid Continuous RF Reference Ground Plane)
# -----------------------------------------------------------------------------
def gen_inner1_gnd():
    apertures = {
        10: "C,0.150000",
        14: "C,5.000000",
        15: "C,0.600000",
        25: "C,1.000000",   # 1.0mm Antipad for isolated signal vias
    }
    lines = make_header("In1.Cu (L2 Solid Continuous GND Plane)", apertures)

    # Solid copper region fill (G36/G37) with 0.5mm edge setback, split around Y=10.0 NPTH guide pins
    emit_rect_region(lines, 0.5, 11.2, BOARD_W - 0.5, BOARD_H - 0.5)
    emit_rect_region(lines, 0.5, 0.5, BOARD_W - 0.5, 8.8)
    emit_rect_region(lines, 30.2, 8.8, 44.8, 11.2)

    # M2.5 mounting pads & 36 ground via fence pads (direct connection to GND)
    lines.append("D14*")
    for hx, hy in [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    lines.append("D15*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        lines.append(f"X{fmt_coord(CX + r_ring * math.cos(theta))}Y{fmt_coord(CY + r_ring * math.sin(theta))}D03*")

    # Antipad clear flashes (%LPC*%) for all 32 signal fanout vias (isolating from GND plane)
    lines.append("%LPC*%")
    lines.append("D25*")
    qsh_x0 = CX - 7.25
    for i in range(16):
        lines.append(f"X{fmt_coord(CX - 7.5 + i * 1.0)}Y{fmt_coord(49.0)}D03*")
        lines.append(f"X{fmt_coord(qsh_x0 + i * 0.5)}Y{fmt_coord(12.4)}D03*")
    lines.append("%LPD*%")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 5. In2.Cu (Layer 3: Solid Split Power Planes)
# -----------------------------------------------------------------------------
def gen_inner2_pwr():
    apertures = {
        10: "C,0.200000",
        25: "C,1.000000",   # 1.0mm Antipad for isolated vias
        26: "C,4.200000",   # 4.2mm Antipad for M2.5 mounting holes
    }
    lines = make_header("In2.Cu (L3 Solid Split Power Planes)", apertures)

    # Zone 1 (+3.3V Analog): X from 0.5 to 37.0, Y from 20.0 to 74.5
    emit_rect_region(lines, 0.5, 20.0, 37.0, 74.5)
    # Zone 2 (+1.8V Digital): X from 38.0 to 74.5, Y from 20.0 to 74.5
    emit_rect_region(lines, 38.0, 20.0, 74.5, 74.5)
    # Zone 3 (-3.3V BPD Reverse Bias): X from 0.5 to 74.5, Y from 0.5 to 8.8 (clearing NPTH at Y=10.0)
    emit_rect_region(lines, 0.5, 0.5, 74.5, 8.8)

    # Antipad clear flashes (%LPC*%) isolating Power planes from:
    # 1. 4 mounting holes
    # 2. 36 ground fence vias
    # 3. 32 signal fanout vias
    lines.append("%LPC*%")
    lines.append("D26*")
    for hx, hy in [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    lines.append("D25*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        lines.append(f"X{fmt_coord(CX + r_ring * math.cos(theta))}Y{fmt_coord(CY + r_ring * math.sin(theta))}D03*")

    qsh_x0 = CX - 7.25
    for i in range(16):
        lines.append(f"X{fmt_coord(CX - 7.5 + i * 1.0)}Y{fmt_coord(49.0)}D03*")
        lines.append(f"X{fmt_coord(qsh_x0 + i * 0.5)}Y{fmt_coord(12.4)}D03*")
    lines.append("%LPD*%")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 6. In3.Cu (Layer 4: Inner Stripline Digital / VCSEL Driver Routing Layer)
# -----------------------------------------------------------------------------
def gen_inner3_sig():
    apertures = {
        10: "C,0.150000",
        15: "C,0.600000",
    }
    lines = make_header("In3.Cu (L4 Inner Stripline Signal Routing)", apertures)

    qsh_x0 = CX - 7.25
    # Vias at Y=49.0 (from VCSEL array fanout) and Y=12.4 (to Samtec J1)
    lines.append("D15*")
    for i in range(16):
        vx_top = CX - 7.5 + i * 1.0
        vx_bot = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(vx_top)}Y{fmt_coord(49.0)}D03*")
        lines.append(f"X{fmt_coord(vx_bot)}Y{fmt_coord(12.4)}D03*")

    # Stripline routing connecting all 16 VCSEL driver channels to Samtec J1
    lines.append("D10*")
    for i in range(16):
        vx_top = CX - 7.5 + i * 1.0
        vx_bot = qsh_x0 + i * 0.5
        # Route around the central analog keepout via left/right corridors
        corridor_x = 16.0 + i * 0.35 if i < 8 else 59.0 - (15 - i) * 0.35
        lines.append(f"X{fmt_coord(vx_top)}Y{fmt_coord(49.0)}D02*")
        lines.append(f"X{fmt_coord(corridor_x)}Y{fmt_coord(47.0 - (i%8)*0.4)}D01*")
        lines.append(f"X{fmt_coord(corridor_x)}Y{fmt_coord(15.0 + (i%8)*0.4)}D01*")
        lines.append(f"X{fmt_coord(vx_bot)}Y{fmt_coord(12.4)}D01*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 7. In4.Cu (Layer 5: Solid Secondary Shield Ground Plane)
# -----------------------------------------------------------------------------
def gen_inner4_gnd():
    apertures = {
        10: "C,0.150000",
        14: "C,5.000000",
        15: "C,0.600000",
        25: "C,1.000000",   # 1.0mm Antipad for isolated signal vias
    }
    lines = make_header("In4.Cu (L5 Secondary Shield GND Plane)", apertures)

    emit_rect_region(lines, 0.5, 11.2, BOARD_W - 0.5, BOARD_H - 0.5)
    emit_rect_region(lines, 0.5, 0.5, BOARD_W - 0.5, 8.8)
    emit_rect_region(lines, 30.2, 8.8, 44.8, 11.2)

    lines.append("D14*")
    for hx, hy in [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    lines.append("D15*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        lines.append(f"X{fmt_coord(CX + r_ring * math.cos(theta))}Y{fmt_coord(CY + r_ring * math.sin(theta))}D03*")

    # Antipad clear flashes (%LPC*%) for all 32 signal fanout vias (isolating from GND plane)
    lines.append("%LPC*%")
    lines.append("D25*")
    qsh_x0 = CX - 7.25
    for i in range(16):
        lines.append(f"X{fmt_coord(CX - 7.5 + i * 1.0)}Y{fmt_coord(49.0)}D03*")
        lines.append(f"X{fmt_coord(qsh_x0 + i * 0.5)}Y{fmt_coord(12.4)}D03*")
    lines.append("%LPD*%")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 8. B.Cu (Layer 6: Bottom Copper Shield & Via Landings)
# -----------------------------------------------------------------------------
def gen_bottom_copper():
    apertures = {
        10: "C,0.150000",
        14: "C,5.000000",
        15: "C,0.600000",
    }
    lines = make_header("B.Cu (L6 Bottom Copper)", apertures)

    # M2.5 Mounting Pads
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # Ground via fence bottoms + signal via bottoms
    lines.append("D15*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(vy)}D03*")

    qsh_x0 = CX - 7.25
    for i in range(16):
        lines.append(f"X{fmt_coord(CX - 7.5 + i * 1.0)}Y{fmt_coord(49.0)}D03*")
        lines.append(f"X{fmt_coord(qsh_x0 + i * 0.5)}Y{fmt_coord(12.4)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 9. F.Mask (Top Solder Mask)
# -----------------------------------------------------------------------------
def gen_top_mask():
    # 0.05mm expansion over pads
    apertures = {
        13: "C,1.350000",   # 1.35mm stroke for Au ground ring opening (54mm OD / 51.5mm ID)
        14: "C,5.100000",   # M2.5 mounting hole mask opening
        16: "R,0.250000X0.450000",  # VCSEL / BPD mask opening
        17: "R,0.600000X0.330000",  # WSON-8 pad opening (leaving 0.17mm solder mask dam)
        18: "R,1.000000X1.300000",  # Thermal pad opening
        19: "R,0.700000X0.600000",  # 0402 pad opening
        20: "R,0.400000X1.600000",  # Samtec pin opening
        21: "R,1.600000X4.100000",  # SMA ground pad opening
        22: "R,0.700000X2.600000",  # SMA center signal pad opening
    }
    lines = make_header("F.Mask (Top Solder Mask)", apertures)

    # 1. M2.5 Mounting Holes
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # 2. Au Ground Ring Opening (Fully exposed ENIG gold ring for Faraday / Cavity seal)
    lines.append("D13*")
    r_ring = 26.375
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}D02*")
    lines.append("G03*")
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}I{fmt_coord(-r_ring)}J0D01*")
    lines.append("G01*")

    # 3. VCSEL Pads (Anode + Cathode)
    lines.append("D16*")
    pitch = 0.25
    x_start = CX - (15 * pitch) / 2.0
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(43.2)}D03*")

    # 4. InGaAs BPD Pads (2 terminals per photodiode)
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(34.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(30.0)}D03*")

    # 5. TIA U1
    lines.append("D18*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")
    lines.append("D17*")
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # 6. Feedback Resistor Rf (at Y=26.5)
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(26.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.8)}Y{fmt_coord(26.5)}D03*")

    # 7. Samtec Connector
    lines.append("D20*")
    qsh_x0 = CX - 7.25
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    # 8. SMA Connector (Center Signal Pad D22 + Ground Pads D21)
    lines.append("D22*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(1.5)}D03*")
    lines.append("D21*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(2.0)}D03*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(2.0)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 10. B.Mask (Bottom Solder Mask)
# -----------------------------------------------------------------------------
def gen_bottom_mask():
    apertures = {
        14: "C,5.100000",
    }
    lines = make_header("B.Mask (Bottom Solder Mask)", apertures)
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 11. F.Paste (Top Solder Paste)
# -----------------------------------------------------------------------------
def gen_top_paste():
    apertures = {
        16: "R,0.150000X0.350000",
        17: "R,0.450000X0.220000",  # WSON-8 paste stencil opening
        18: "R,0.800000X1.100000",  # Thermal pad paste opening
        19: "R,0.500000X0.450000",  # 0402 paste opening,
        20: "R,0.300000X1.500000",
    }
    lines = make_header("F.Paste (Top Solder Paste)", apertures)

    # VCSEL Pads
    lines.append("D16*")
    pitch = 0.25
    x_start = CX - (15 * pitch) / 2.0
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(43.2)}D03*")

    # InGaAs BPD Pads
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(34.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(30.0)}D03*")

    # TIA U1
    lines.append("D18*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")
    lines.append("D17*")
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # Feedback Resistor Rf (at Y=26.5)
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(26.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.8)}Y{fmt_coord(26.5)}D03*")

    # Samtec Connector
    lines.append("D20*")
    qsh_x0 = CX - 7.25
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 12. Excellon NC Drill File (.drl)
# -----------------------------------------------------------------------------
def gen_drill_file():
    lines = [
        "M48",
        "; AXON Optical CPNPU Carrier NC Drill (IPC-NC-349 / Excellon Format 2)",
        "METRIC,LZ",
        "FMAT,2",
        "G90",
        "T01C2.700",  # M2.5 plated mounting holes (4)
        "T02C0.300",  # Plated vias: 36 GND fence + 32 signal fanout = 68 vias
        "T03C0.800",  # Connector alignment guide pins (2)
        "%",
        "G05",
        "; Tool 1: M2.5 Mounting Holes (4 holes)",
        "T01",
    ]
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_drill(hx)}Y{fmt_drill(hy)}")

    lines.append("; Tool 2: Ground Fence Vias (36) + Interlayer Signal Vias (32)")
    lines.append("T02")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_drill(vx)}Y{fmt_drill(vy)}")

    qsh_x0 = CX - 7.25
    for i in range(16):
        lines.append(f"X{fmt_drill(CX - 7.5 + i * 1.0)}Y{fmt_drill(49.0)}")
        lines.append(f"X{fmt_drill(qsh_x0 + i * 0.5)}Y{fmt_drill(12.4)}")

    lines.append("; Tool 3: Guide Pins (2 holes)")
    lines.append("T03")
    lines.append(f"X{fmt_drill(CX - 8.5)}Y{fmt_drill(10.0)}")
    lines.append(f"X{fmt_drill(CX + 8.5)}Y{fmt_drill(10.0)}")

    lines.append("M30")
    return "\n".join(lines) + "\n"


# -----------------------------------------------------------------------------
# 13. KiCad PCB File (.kicad_pcb) - Valid S-Expression (No HTML comments)
# -----------------------------------------------------------------------------
def gen_kicad_pcb():
    return """(kicad_pcb (version 20221018) (generator pcbnew)

  (general
    (thickness 1.6)
  )

  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (1 "In1.Cu" power "GND")
    (2 "In2.Cu" power "PWR")
    (3 "In3.Cu" signal "SIG_INNER")
    (4 "In4.Cu" power "GND_SHIELD")
    (31 "B.Cu" signal)
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user "B.Silkscreen")
    (37 "F.SilkS" user "F.Silkscreen")
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (44 "Edge.Cuts" user)
  )

  (setup
    (pad_to_mask_clearance 0.05)
    (pcbplotparams
      (layerselection 0x00010fc_ffffffff)
      (usegerberextensions true)
      (usegerberattributes true)
      (usegerberadvancedattributes true)
      (creategerberjobfile true)
      (outputformat 1)
      (plotframeref false)
      (viasonmask false)
      (mode 1)
      (useauxorigin false)
      (hpglpennumber 1)
      (hpglpenspeed 20)
      (hpglpendiameter 15.000000)
      (psnegative false)
      (psa4output false)
      (plotreference true)
      (plotvalue true)
      (plotinvisibletext false)
      (sketchpadsonfab false)
      (subtractmaskfromsilk false)
      (outputdirectory "gerber/")
    )
  )

  (net 0 "")
  (net 1 "GND")
  (net 2 "+3V3_OPT")
  (net 3 "-3V3_BIAS")
  (net 4 "KCL_SUM_ANA")
  (net 5 "RF_OUT_50OHM")

  (gr_line (start 1.5 0) (end 73.5 0) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 73.5 0) (end 75 1.5) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 75 1.5) (end 75 73.5) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 75 73.5) (end 73.5 75) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 73.5 75) (end 1.5 75) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 1.5 75) (end 0 73.5) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 0 73.5) (end 0 1.5) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 0 1.5) (end 1.5 0) (layer "Edge.Cuts") (width 0.15))

  (gr_rect (start 8.5 8.5) (end 66.5 66.5) (layer "F.SilkS") (width 0.15))
  (gr_rect (start 15.0 15.0) (end 60.0 60.0) (layer "F.SilkS") (width 0.15))

  (gr_text "AXON-LABS-ORG // PAT-35/36 OPTICAL CPNPU CARRIER REV A1" (at 37.5 70.0) (layer "F.SilkS")
    (effects (font (size 1.2 1.2) (thickness 0.15)))
  )

  (footprint "MountingHole:MountingHole_2.7mm_M2.5_Pad_Via" (layer "F.Cu")
    (at 12.5 12.5)
    (pad "1" thru_hole circle (at 0 0) (size 5.0 5.0) (drill 2.7) (layers *.Cu *.Mask) (net 1 "GND"))
  )
  (footprint "MountingHole:MountingHole_2.7mm_M2.5_Pad_Via" (layer "F.Cu")
    (at 62.5 12.5)
    (pad "1" thru_hole circle (at 0 0) (size 5.0 5.0) (drill 2.7) (layers *.Cu *.Mask) (net 1 "GND"))
  )
  (footprint "MountingHole:MountingHole_2.7mm_M2.5_Pad_Via" (layer "F.Cu")
    (at 62.5 62.5)
    (pad "1" thru_hole circle (at 0 0) (size 5.0 5.0) (drill 2.7) (layers *.Cu *.Mask) (net 1 "GND"))
  )
  (footprint "MountingHole:MountingHole_2.7mm_M2.5_Pad_Via" (layer "F.Cu")
    (at 12.5 62.5)
    (pad "1" thru_hole circle (at 0 0) (size 5.0 5.0) (drill 2.7) (layers *.Cu *.Mask) (net 1 "GND"))
  )

  (footprint "Package_SON:WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.2mm" (layer "F.Cu")
    (at 37.5 23.0)
    (pad "1" smd rect (at -0.95 0.75) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask"))
    (pad "2" smd rect (at -0.95 0.25) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 4 "KCL_SUM_ANA"))
    (pad "3" smd rect (at -0.95 -0.25) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "4" smd rect (at -0.95 -0.75) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 3 "-3V3_BIAS"))
    (pad "5" smd rect (at 0.95 -0.75) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "6" smd rect (at 0.95 -0.25) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 5 "RF_OUT_50OHM"))
    (pad "7" smd rect (at 0.95 0.25) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "8" smd rect (at 0.95 0.75) (size 0.5 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 2 "+3V3_OPT"))
    (pad "9" smd rect (at 0 0) (size 0.9 1.2) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
  )

  (footprint "Resistor_SMD:R_0402_1005Metric" (layer "F.Cu")
    (at 37.5 26.5)
    (pad "1" smd rect (at -0.8 0) (size 0.6 0.5) (layers "F.Cu" "F.Paste" "F.Mask") (net 4 "KCL_SUM_ANA"))
    (pad "2" smd rect (at 0.8 0) (size 0.6 0.5) (layers "F.Cu" "F.Paste" "F.Mask") (net 5 "RF_OUT_50OHM"))
  )

  (segment (start 37.5 32.0) (end 37.5 28.0) (width 0.25) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))
  (segment (start 37.5 28.0) (end 35.0 25.5) (width 0.25) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))
  (segment (start 35.0 25.5) (end 35.0 23.25) (width 0.25) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))
  (segment (start 35.0 23.25) (end 36.55 23.25) (width 0.15) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))
  (segment (start 36.7 26.5) (end 35.0 26.5) (width 0.15) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))
  (segment (start 35.0 26.5) (end 35.0 23.25) (width 0.15) (layer "F.Cu") (net 4 "KCL_SUM_ANA"))

  (segment (start 38.3 26.5) (end 40.0 26.5) (width 0.15) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
  (segment (start 40.0 26.5) (end 40.0 22.75) (width 0.15) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
  (segment (start 40.0 22.75) (end 38.45 22.75) (width 0.15) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
  (segment (start 40.0 22.75) (end 40.0 16.0) (width 0.35) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
  (segment (start 40.0 16.0) (end 37.5 13.5) (width 0.35) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
  (segment (start 37.5 13.5) (end 37.5 1.5) (width 0.35) (layer "F.Cu") (net 5 "RF_OUT_50OHM"))
)
"""


def main():
    files = {
        "AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr": gen_edge_cuts(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_SilkS.gto": gen_top_silkscreen(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl": gen_top_copper(),
        "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1": gen_inner1_gnd(),
        "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2": gen_inner2_pwr(),
        "AXON_OPTICAL_CPNPU_CARRIER-In3_Cu.g3": gen_inner3_sig(),
        "AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4": gen_inner4_gnd(),
        "AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl": gen_bottom_copper(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts": gen_top_mask(),
        "AXON_OPTICAL_CPNPU_CARRIER-B_Mask.gbs": gen_bottom_mask(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Paste.gtp": gen_top_paste(),
        "AXON_OPTICAL_CPNPU_CARRIER.drl": gen_drill_file(),
    }

    print(f"=== Generating 6-Layer Gerber Files into: {GERBER_DIR} ===")
    for fname, content in files.items():
        fpath = os.path.join(GERBER_DIR, fname)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [OK] {fname} ({len(content)} bytes)")

    # KiCad PCB
    kicad_path = os.path.join(OUT_DIR, "AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb")
    with open(kicad_path, "w", encoding="utf-8") as f:
        f.write(gen_kicad_pcb())
    print(f"  [OK] AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb ({os.path.getsize(kicad_path)} bytes)")

    # Zip Bundle
    zip_path = os.path.join(OUT_DIR, "AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for fname in files.keys():
            zipf.write(os.path.join(GERBER_DIR, fname), arcname=fname)
        zipf.write(kicad_path, arcname="AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb")
    print(f"=== [SUCCESS] Gerber Zip Archive Created: {zip_path} ({os.path.getsize(zip_path)} bytes) ===")


if __name__ == "__main__":
    main()
