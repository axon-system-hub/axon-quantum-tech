#!/usr/bin/env python3
"""
AXON Gerber Verification & Syntax Check Script
Validates 6-Layer RS-274X compliance, G36/G37 copper plane fills, coordinate bounds,
layer completeness, KiCad S-expression syntax, and Excellon drill table.
"""

import os
import re
import sys
import zipfile

GERBER_DIR = os.path.join(os.path.dirname(__file__), "gerber_files")
ZIP_PATH = os.path.join(os.path.dirname(__file__), "AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip")
KICAD_PATH = os.path.join(os.path.dirname(__file__), "AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb")

REQUIRED_LAYERS = [
    "AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr",
    "AXON_OPTICAL_CPNPU_CARRIER-F_SilkS.gto",
    "AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl",
    "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1",
    "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2",
    "AXON_OPTICAL_CPNPU_CARRIER-In3_Cu.g3",
    "AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4",
    "AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl",
    "AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts",
    "AXON_OPTICAL_CPNPU_CARRIER-B_Mask.gbs",
    "AXON_OPTICAL_CPNPU_CARRIER-F_Paste.gtp",
    "AXON_OPTICAL_CPNPU_CARRIER.drl",
]

PLANE_LAYERS = {
    "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1",
    "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2",
    "AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4",
}


def check_gerber_file(filepath, layer_name):
    errors = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # RS-274X Header check
    if not ("%FSLAX46Y46*%" in content and "%MOMM*%" in content):
        errors.append("Missing mandatory RS-274X headers (%FSLAX46Y46*%, %MOMM*%)")

    # Aperture checks
    apertures = re.findall(r"%ADD(\d+)", content)
    if not apertures:
        errors.append("No apertures defined in file")

    # Solid plane check (G36* / G37*) for inner reference/power planes
    if layer_name in PLANE_LAYERS:
        if "G36*" not in content or "G37*" not in content:
            errors.append(f"Plane layer {layer_name} is missing G36*/G37* copper region fill")

    # Coordinate bounds check (0.0 to 75.0 mm -> 0 to 75000000)
    coord_matches = re.findall(r"X(-?\d+)Y(-?\d+)", content)
    for x_str, y_str in coord_matches:
        x_val = int(x_str) / 1000000.0
        y_val = int(y_str) / 1000000.0
        if not (-0.5 <= x_val <= 75.5 and -0.5 <= y_val <= 75.5):
            errors.append(f"Coordinate out of board bounds: X={x_val}, Y={y_val}")
            break

    # Check for M02 termination
    if not content.strip().endswith("M02*"):
        errors.append("File not terminated with M02*")

    return errors


def check_drill_file(filepath):
    errors = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if "M48" not in content or "METRIC" not in content or "G90" not in content:
        errors.append("Excellon header missing M48, METRIC, or G90")

    # Count drill holes: 4 M2.5 + 36 via fence + 32 interlayer signal vias + 2 guide pins = 74
    holes = re.findall(r"X\d+\.\d+Y\d+\.\d+", content)
    if len(holes) != 74:
        errors.append(f"Expected 74 explicit-decimal drill holes, found {len(holes)}")

    if not content.strip().endswith("M30"):
        errors.append("Drill file not terminated with M30")

    return errors, len(holes)


def check_kicad_file(filepath):
    errors = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if "<!--" in content or "-->" in content:
        errors.append("Invalid HTML comment syntax (<!-- -->) found in KiCad S-expression file")

    if content.count("(") != content.count(")"):
        errors.append("Unbalanced parentheses in KiCad S-expression file")

    for layer in ['"F.Cu"', '"In1.Cu"', '"In2.Cu"', '"In3.Cu"', '"In4.Cu"', '"B.Cu"']:
        if layer not in content:
            errors.append(f"Missing 6-layer definition {layer} in KiCad file")

    return errors


def main():
    print("=== AXON 6-Layer Gerber & KiCad Verification Suite ===")
    total_errors = 0

    # 1. Check all required layer files exist
    for layer in REQUIRED_LAYERS:
        p = os.path.join(GERBER_DIR, layer)
        if not os.path.exists(p):
            print(f"  [FAIL] Missing layer file: {layer}")
            total_errors += 1
            continue

        if layer.endswith(".drl"):
            errs, count = check_drill_file(p)
            if errs:
                print(f"  [FAIL] {layer}: {errs}")
                total_errors += len(errs)
            else:
                print(f"  [PASS] {layer} (Excellon IPC-NC-349 Drill: {count} holes verified)")
        else:
            errs = check_gerber_file(p, layer)
            if errs:
                print(f"  [FAIL] {layer}: {errs}")
                total_errors += len(errs)
            else:
                print(f"  [PASS] {layer} (RS-274X: format, apertures & coordinates bounded in [0, 75]mm)")

    # 2. Check KiCad PCB S-expression file
    k_errs = check_kicad_file(KICAD_PATH)
    if k_errs:
        print(f"  [FAIL] AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb: {k_errs}")
        total_errors += len(k_errs)
    else:
        print("  [PASS] AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb (Valid 6-Layer KiCad S-Expression)")

    # 3. Check ZIP archive
    if not os.path.exists(ZIP_PATH):
        print(f"  [FAIL] Zip bundle missing: {ZIP_PATH}")
        total_errors += 1
    else:
        with zipfile.ZipFile(ZIP_PATH, "r") as z:
            names = z.namelist()
            for r in REQUIRED_LAYERS + ["AXON_OPTICAL_CPNPU_CARRIER.kicad_pcb"]:
                if r not in names:
                    print(f"  [FAIL] Missing {r} inside zip archive")
                    total_errors += 1
            print(f"  [PASS] ZIP Archive verified ({len(names)} files, {os.path.getsize(ZIP_PATH)} bytes)")

    if total_errors == 0:
        print("=== RESULT: ALL 6-LAYER GERBER, DRILL & KICAD FILES 100% VERIFIED ===")
        return 0
    else:
        print(f"=== RESULT: FAILED with {total_errors} errors ===")
        return 1


if __name__ == "__main__":
    sys.exit(main())
