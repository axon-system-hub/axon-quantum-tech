#!/usr/bin/env python3
"""
AXON-PAT-35/36 Optical CPNPU Carrier Baseboard PCB Gerber & KiCad Generator
Generates full RS-274X Gerber layer files, Excellon NC Drill file, and KiCad PCB file.
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
        (ch, 0.0)
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
    lid_x0 = CX - 29.0
    lid_y0 = CY - 29.0
    lid_x1 = CX + 29.0
    lid_y1 = CY + 29.0
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y0)}D02*")
    lines.append(f"X{fmt_coord(lid_x1)}Y{fmt_coord(lid_y0)}D01*")
    lines.append(f"X{fmt_coord(lid_x1)}Y{fmt_coord(lid_y1)}D01*")
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y1)}D01*")
    lines.append(f"X{fmt_coord(lid_x0)}Y{fmt_coord(lid_y0)}D01*")

    # 2. 45 x 45 mm Optical Reflection Pocket Boundary
    pkt_x0 = CX - 22.5
    pkt_y0 = CY - 22.5
    pkt_x1 = CX + 22.5
    pkt_y1 = CY + 22.5
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
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(8.5)}D02*")
    lines.append(f"X{fmt_coord(CX+10.0)}Y{fmt_coord(8.5)}D01*")
    lines.append(f"X{fmt_coord(CX+10.0)}Y{fmt_coord(11.5)}D01*")
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(11.5)}D01*")
    lines.append(f"X{fmt_coord(CX-10.0)}Y{fmt_coord(8.5)}D01*")

    # VCSEL Array Outline at Y=44.0
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(43.0)}D02*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(43.0)}D01*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(45.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(45.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(43.0)}D01*")

    # InGaAs BPD Array Outline at Y=32.0
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(30.0)}D02*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(30.0)}D01*")
    lines.append(f"X{fmt_coord(CX+3.0)}Y{fmt_coord(34.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(34.0)}D01*")
    lines.append(f"X{fmt_coord(CX-3.0)}Y{fmt_coord(30.0)}D01*")

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
# 3. F.Cu (Top Copper)
# -----------------------------------------------------------------------------
def gen_top_copper():
    apertures = {
        10: "C,0.150000",   # 0.15mm trace
        11: "C,0.250000",   # 0.25mm trace
        12: "C,0.350000",   # 0.35mm 50-ohm RF trace
        13: "C,1.250000",   # 1.25mm circular annular ring stroke
        14: "C,5.000000",   # 5.0mm M2.5 mounting pad
        15: "C,0.600000",   # 0.6mm via pad
        16: "R,0.150000X0.350000",  # VCSEL / BPD micro pad
        17: "R,0.250000X0.600000",  # QFN / WSON-8 pad
        18: "R,1.200000X1.600000",  # WSON-8 thermal exposed pad
        19: "R,0.500000X0.600000",  # 0402 component pad
        20: "R,0.300000X1.500000",  # Samtec connector pin pad
        21: "R,1.500000X4.000000",  # SMA RF connector ground pad
    }
    lines = make_header("F.Cu (Top Copper)", apertures)

    # 1. M2.5 Mounting Pads (4 corners)
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # 2. O-Ring / Faraday Shield Continuous Ground Ring (Radius 26.375 mm, Width 1.25 mm)
    # R_mid = (54.0 + 51.5) / 4.0 = 26.375 mm
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

    # 4. 16-channel VCSEL Transmitter Pads (Y = 44.0 mm, 250um pitch)
    lines.append("D16*")
    pitch = 0.25
    x_start = CX - (15 * pitch) / 2.0  # centered at CX
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D03*")

    # VCSEL fanout traces to driver header
    lines.append("D10*")
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.175)}D02*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(46.0 + (i%4)*0.5)}D01*")
        lines.append(f"X{fmt_coord(CX - 8.0 + i*1.0)}Y{fmt_coord(49.0)}D01*")

    # 5. 2x 1x16 InGaAs Balanced Photodiode (BPD) Array Pads (Y=33.0 (+) and Y=31.0 (-))
    lines.append("D16*")
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")  # Positive array
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")  # Negative array

    # 6. KCL Summing Analog Virtual Ground Bus
    # Direct copper connection linking positive anodes and negative cathodes
    lines.append("D11*")  # 0.25mm trace
    lines.append(f"X{fmt_coord(x_start)}Y{fmt_coord(32.0)}D02*")
    lines.append(f"X{fmt_coord(x_start + 15*pitch)}Y{fmt_coord(32.0)}D01*")

    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(32.8)}D02*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.2)}D01*")

    # KCL Bus Feed to TIA U1 Inverting Input (Pin 2 at CX-0.8, Y=23.5)
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(32.0)}D02*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(24.5)}D01*")
    lines.append(f"X{fmt_coord(CX - 0.8)}Y{fmt_coord(23.5)}D01*")

    # 7. TIA U1 (OPA855 WSON-8) Footprint at (CX, 23.0)
    lines.append("D18*")  # Thermal pad
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")

    lines.append("D17*")  # 8 pins (4 on left, 4 on right, pitch 0.5mm)
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # Feedback Resistor Rf (0402) between Pin 2 (CX-0.95, 23.25) and Pin 6 (CX+0.95, 22.75)
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.5)}Y{fmt_coord(25.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.5)}Y{fmt_coord(25.5)}D03*")

    # 8. High-Speed 50-ohm RF Coplanar Waveguide Output to SMA J2
    lines.append("D12*")  # 0.35mm trace
    lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(22.75)}D02*")
    lines.append(f"X{fmt_coord(CX + 2.0)}Y{fmt_coord(22.75)}D01*")
    lines.append(f"X{fmt_coord(CX + 2.0)}Y{fmt_coord(16.0)}D01*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(14.0)}D01*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(2.0)}D01*")

    # SMA Edge Launch Connector J2 at (CX, 1.0)
    lines.append("D21*")  # Ground pads
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(2.0)}D03*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(2.0)}D03*")

    # 9. Samtec QSH 60-pin Connector Footprint at (CX, 10.0)
    lines.append("D20*")
    qsh_x0 = CX - 7.5
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 4. In1.Cu (Inner Layer 1: Continuous Ground Plane)
# -----------------------------------------------------------------------------
def gen_inner_gnd():
    apertures = {
        10: "C,0.150000",
        14: "C,5.000000",
        15: "C,0.600000",
    }
    lines = make_header("In1.Cu (Inner GND Plane)", apertures)
    
    # Ground fill boundary (with 0.5mm setback from edge)
    lines.append("D10*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(0.5)}D02*")
    lines.append(f"X{fmt_coord(BOARD_W - 0.5)}Y{fmt_coord(0.5)}D01*")
    lines.append(f"X{fmt_coord(BOARD_W - 0.5)}Y{fmt_coord(BOARD_H - 0.5)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(BOARD_H - 0.5)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(0.5)}D01*")

    # Solid connection to M2.5 mounting holes
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # Ground via fence connections
    lines.append("D15*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(vy)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 5. In2.Cu (Inner Layer 2: Power Planes)
# -----------------------------------------------------------------------------
def gen_inner_pwr():
    apertures = {
        10: "C,0.200000",
        11: "C,0.500000",
    }
    lines = make_header("In2.Cu (Inner Power Plane)", apertures)
    lines.append("D10*")

    # Split planes:
    # Zone 1 (+3.3V Analog): X from 0.5 to 37.0, Y from 20.0 to 74.5
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(20.0)}D02*")
    lines.append(f"X{fmt_coord(37.0)}Y{fmt_coord(20.0)}D01*")
    lines.append(f"X{fmt_coord(37.0)}Y{fmt_coord(74.5)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(74.5)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(20.0)}D01*")

    # Zone 2 (+1.8V Digital): X from 38.0 to 74.5, Y from 20.0 to 74.5
    lines.append(f"X{fmt_coord(38.0)}Y{fmt_coord(20.0)}D02*")
    lines.append(f"X{fmt_coord(74.5)}Y{fmt_coord(20.0)}D01*")
    lines.append(f"X{fmt_coord(74.5)}Y{fmt_coord(74.5)}D01*")
    lines.append(f"X{fmt_coord(38.0)}Y{fmt_coord(74.5)}D01*")
    lines.append(f"X{fmt_coord(38.0)}Y{fmt_coord(20.0)}D01*")

    # Zone 3 (-3.3V BPD Reverse Bias): Y from 0.5 to 19.0
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(0.5)}D02*")
    lines.append(f"X{fmt_coord(74.5)}Y{fmt_coord(0.5)}D01*")
    lines.append(f"X{fmt_coord(74.5)}Y{fmt_coord(19.0)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(19.0)}D01*")
    lines.append(f"X{fmt_coord(0.5)}Y{fmt_coord(0.5)}D01*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 6. B.Cu (Bottom Copper)
# -----------------------------------------------------------------------------
def gen_bottom_copper():
    apertures = {
        10: "C,0.150000",
        14: "C,5.000000",
        15: "C,0.600000",
        20: "R,0.300000X1.500000",
    }
    lines = make_header("B.Cu (Bottom Copper)", apertures)

    # M2.5 Mounting Pads
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # Ground via fence bottoms
    lines.append("D15*")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_coord(vx)}Y{fmt_coord(vy)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 7. F.Mask (Top Solder Mask)
# -----------------------------------------------------------------------------
def gen_top_mask():
    # 0.05mm expansion over pads
    apertures = {
        13: "C,1.350000",   # 1.35mm stroke for Au ground ring opening
        14: "C,5.100000",   # M2.5 mounting hole mask opening
        16: "R,0.250000X0.450000",  # VCSEL / BPD mask opening
        17: "R,0.350000X0.700000",  # WSON-8 pad opening
        18: "R,1.300000X1.700000",  # Thermal pad opening
        19: "R,0.600000X0.700000",  # 0402 pad opening
        20: "R,0.400000X1.600000",  # Samtec pin opening
        21: "R,1.600000X4.100000",  # SMA ground pad opening
    }
    lines = make_header("F.Mask (Top Solder Mask)", apertures)

    # 1. M2.5 Mounting Holes
    lines.append("D14*")
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_coord(hx)}Y{fmt_coord(hy)}D03*")

    # 2. Au Ground Ring Opening (Fully exposed gold ring for Faraday / Cavity seal)
    lines.append("D13*")
    r_ring = 26.375
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}D02*")
    lines.append("G03*")
    lines.append(f"X{fmt_coord(CX + r_ring)}Y{fmt_coord(CY)}I{fmt_coord(-r_ring)}J0D01*")
    lines.append("G01*")

    # 3. VCSEL Pads
    lines.append("D16*")
    pitch = 0.25
    x_start = CX - (15 * pitch) / 2.0
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(44.0)}D03*")

    # 4. InGaAs BPD Pads
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")

    # 5. TIA U1
    lines.append("D18*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")
    lines.append("D17*")
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # 6. Feedback Resistor
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.5)}Y{fmt_coord(25.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.5)}Y{fmt_coord(25.5)}D03*")

    # 7. Samtec Connector
    lines.append("D20*")
    qsh_x0 = CX - 7.5
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    # 8. SMA Connector
    lines.append("D21*")
    lines.append(f"X{fmt_coord(CX - 2.5)}Y{fmt_coord(2.0)}D03*")
    lines.append(f"X{fmt_coord(CX + 2.5)}Y{fmt_coord(2.0)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 8. B.Mask (Bottom Solder Mask)
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
# 9. F.Paste (Top Solder Paste)
# -----------------------------------------------------------------------------
def gen_top_paste():
    apertures = {
        16: "R,0.150000X0.350000",
        17: "R,0.250000X0.600000",
        18: "R,1.100000X1.500000",
        19: "R,0.500000X0.600000",
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

    # InGaAs BPD Pads
    for i in range(16):
        px = x_start + i * pitch
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(33.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(31.0)}D03*")

    # TIA U1
    lines.append("D18*")
    lines.append(f"X{fmt_coord(CX)}Y{fmt_coord(23.0)}D03*")
    lines.append("D17*")
    wson_y = [23.75, 23.25, 22.75, 22.25]
    for y_pos in wson_y:
        lines.append(f"X{fmt_coord(CX - 0.95)}Y{fmt_coord(y_pos)}D03*")
        lines.append(f"X{fmt_coord(CX + 0.95)}Y{fmt_coord(y_pos)}D03*")

    # Feedback Resistor
    lines.append("D19*")
    lines.append(f"X{fmt_coord(CX - 0.5)}Y{fmt_coord(25.5)}D03*")
    lines.append(f"X{fmt_coord(CX + 0.5)}Y{fmt_coord(25.5)}D03*")

    # Samtec Connector
    lines.append("D20*")
    qsh_x0 = CX - 7.5
    for i in range(30):
        px = qsh_x0 + i * 0.5
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(9.0)}D03*")
        lines.append(f"X{fmt_coord(px)}Y{fmt_coord(11.0)}D03*")

    lines.append("M02*")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 10. Excellon NC Drill File (.drl)
# -----------------------------------------------------------------------------
def gen_drill_file():
    lines = [
        "M48",
        "; AXON Optical CPNPU Carrier NC Drill (IPC-NC-349 / Excellon Format 2)",
        "METRIC,LZ",
        "FMAT,2",
        "G90",
        "T01C2.700",  # M2.5 mounting holes
        "T02C0.300",  # Ground fence vias
        "T03C0.800",  # Connector alignment guide pins
        "%",
        "G05",
        "; Tool 1: M2.5 Mounting Holes (4 holes)",
        "T01",
    ]
    holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
    for hx, hy in holes:
        lines.append(f"X{fmt_drill(hx)}Y{fmt_drill(hy)}")

    lines.append("; Tool 2: Ground Fence Vias (36 vias)")
    lines.append("T02")
    r_ring = 26.375
    for i in range(36):
        theta = i * (2.0 * math.pi / 36.0)
        vx = CX + r_ring * math.cos(theta)
        vy = CY + r_ring * math.sin(theta)
        lines.append(f"X{fmt_drill(vx)}Y{fmt_drill(vy)}")

    lines.append("; Tool 3: Guide Pins (2 holes)")
    lines.append("T03")
    lines.append(f"X{fmt_drill(CX - 8.5)}Y{fmt_drill(10.0)}")
    lines.append(f"X{fmt_drill(CX + 8.5)}Y{fmt_drill(10.0)}")

    lines.append("M30")
    return "\n".join(lines) + "\n"

# -----------------------------------------------------------------------------
# 11. KiCad PCB File (.kicad_pcb)
# -----------------------------------------------------------------------------
def gen_kicad_pcb():
    return f"""(kicad_pcb (version 20221018) (generator pcbnew)

  (general
    (thickness 1.6)
  )

  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (1 "In1.Cu" power "GND")
    (2 "In2.Cu" power "PWR")
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

  <!-- Board Outline: 75x75mm -->
  (gr_line (start 0 0) (end 75 0) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 75 0) (end 75 75) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 75 75) (end 0 75) (layer "Edge.Cuts") (width 0.15))
  (gr_line (start 0 75) (end 0 0) (layer "Edge.Cuts") (width 0.15))

  <!-- Cavity Lid Outline: 58x58mm -->
  (gr_rect (start 8.5 8.5) (end 66.5 66.5) (layer "F.SilkS") (width 0.15))
  <!-- Optical Pocket: 45x45mm -->
  (gr_rect (start 15.0 15.0) (end 60.0 60.0) (layer "F.SilkS") (width 0.15))

  <!-- Silkscreen Title -->
  (gr_text "AXON-LABS-ORG // PAT-35/36 OPTICAL CPNPU CARRIER REV A1" (at 37.5 70.0) (layer "F.SilkS")
    (effects (font (size 1.2 1.2) (thickness 0.15)))
  )

  <!-- 4x M2.5 Mounting Holes -->
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

  <!-- OPA855 TIA Footprint -->
  (footprint "Package_SON:WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.6mm" (layer "F.Cu")
    (at 37.5 23.0)
    (pad "1" smd rect (at -0.95 0.75) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask"))
    (pad "2" smd rect (at -0.95 0.25) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 4 "KCL_SUM_ANA"))
    (pad "3" smd rect (at -0.95 -0.25) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "4" smd rect (at -0.95 -0.75) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 3 "-3V3_BIAS"))
    (pad "5" smd rect (at 0.95 -0.75) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "6" smd rect (at 0.95 -0.25) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 5 "RF_OUT_50OHM"))
    (pad "7" smd rect (at 0.95 0.25) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
    (pad "8" smd rect (at 0.95 0.75) (size 0.6 0.25) (layers "F.Cu" "F.Paste" "F.Mask") (net 2 "+3V3_OPT"))
    (pad "9" smd rect (at 0 0) (size 1.2 1.6) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "GND"))
  )
)
"""

def main():
    files = {
        "AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr": gen_edge_cuts(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_SilkS.gto": gen_top_silkscreen(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl": gen_top_copper(),
        "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1": gen_inner_gnd(),
        "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2": gen_inner_pwr(),
        "AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl": gen_bottom_copper(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts": gen_top_mask(),
        "AXON_OPTICAL_CPNPU_CARRIER-B_Mask.gbs": gen_bottom_mask(),
        "AXON_OPTICAL_CPNPU_CARRIER-F_Paste.gtp": gen_top_paste(),
        "AXON_OPTICAL_CPNPU_CARRIER.drl": gen_drill_file(),
    }

    print(f"=== Generating Gerber Layer Files into: {GERBER_DIR} ===")
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

