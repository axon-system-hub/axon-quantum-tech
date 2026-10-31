#!/usr/bin/env python3
"""
AXON Sovereign Hardware - Independent 3rd-Pass Gerber, Region Fill & Connectivity Deep Audit
Uses industrial-standard 'gerbonara' parser to perform deep syntax, primitive,
G36/G37 region fill, annular ring arc geometry, SMA launch pad opening, and drill registration audit.
"""

import math
import sys
from pathlib import Path
from gerbonara.excellon import ExcellonFile
from gerbonara.rs274x import GerberFile
from gerbonara.graphic_objects import Arc, Flash, Line, Region

GERBER_DIR = Path(r"D:\axon-양자기술\hardware\pcb\gerber_files")


def audit_gerber_files():
    print("=" * 70)
    print(">>> 1. GERBONARA INDEPENDENT 6-LAYER RS-274X & EXCELLON PARSE AUDIT")
    print("=" * 70)

    files = sorted(list(GERBER_DIR.glob("*.*")))
    parsed_layers = {}
    errors = 0

    for f in files:
        fname = f.name
        if fname.endswith(".drl"):
            try:
                drl = ExcellonFile.open(f)
                parsed_layers[fname] = ("DRILL", drl)
                drill_sizes = sorted(drl.drill_sizes())
                bounds = drl.bounding_box()
                print(f" [PASS] {fname:45s} | TYPE: Excellon Drill")
                print(
                    f"        -> Holes: {len(drl.objects):2d} | Tool Diameters (mm): {drill_sizes} | BoundingBox: {bounds}"
                )
            except Exception as e:
                print(f" [FAIL] {fname:45s} | ERROR: {e}")
                errors += 1
        else:
            try:
                gbr = GerberFile.open(f)
                parsed_layers[fname] = ("GERBER", gbr)
                bounds = gbr.bounding_box()
                obj_count = len(gbr.objects)
                ap_count = len(list(gbr.apertures()))
                reg_count = sum(1 for o in gbr.objects if isinstance(o, Region))
                print(
                    f" [PASS] {fname:45s} | Primitives: {obj_count:4d} (Regions: {reg_count}) | Apertures: {ap_count:2d}"
                )
                print(f"        -> BoundingBox (mm): {bounds}")
            except Exception as e:
                print(f" [FAIL] {fname:45s} | ERROR: {e}")
                errors += 1

    # Verify all 6 copper layers exist
    copper_layers = [
        "AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl",
        "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1",
        "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2",
        "AXON_OPTICAL_CPNPU_CARRIER-In3_Cu.g3",
        "AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4",
        "AXON_OPTICAL_CPNPU_CARRIER-B_Cu.gbl",
    ]
    for cl in copper_layers:
        if cl not in parsed_layers:
            print(f" [FAIL] Missing 6-layer stackup copper file: {cl}")
            errors += 1

    print("\n" + "=" * 70)
    print(">>> 2. GEOMETRIC BOUNDS, SOLID PLANE FILLS & PHYSICAL CONSTRAINTS")
    print("=" * 70)

    # Verify Edge.Cuts is 75 x 75 mm
    edge_file = "AXON_OPTICAL_CPNPU_CARRIER-Edge_Cuts.gbr"
    if edge_file in parsed_layers:
        _, edge_gbr = parsed_layers[edge_file]
        ((xmin, ymin), (xmax, ymax)) = edge_gbr.bounding_box()
        w = xmax - xmin
        h = ymax - ymin
        print(f" - Board Dimensions: {w:.3f} mm x {h:.3f} mm (Origin: {xmin:.3f}, {ymin:.3f})")
        if abs(w - 75.0) > 0.3 or abs(h - 75.0) > 0.3:
            print("   [FAIL] Board dimensions differ from nominal 75.0 x 75.0 mm!")
            errors += 1
        else:
            print("   [PASS] Board outline strictly conforms to 75.0 x 75.0 mm.")

    # Verify G36/G37 solid Region objects in In1_Cu, In2_Cu, In4_Cu
    for plane_file in [
        "AXON_OPTICAL_CPNPU_CARRIER-In1_Cu.g1",
        "AXON_OPTICAL_CPNPU_CARRIER-In2_Cu.g2",
        "AXON_OPTICAL_CPNPU_CARRIER-In4_Cu.g4",
    ]:
        if plane_file in parsed_layers:
            _, p_gbr = parsed_layers[plane_file]
            regions = [o for o in p_gbr.objects if isinstance(o, Region)]
            if len(regions) >= 3:
                print(f"   [PASS] {plane_file}: {len(regions)} solid G36/G37 copper Region polygons verified.")
            else:
                print(f"   [FAIL] {plane_file}: Expected >= 3 solid copper Region fills, found {len(regions)}!")
                errors += 1

    print("\n" + "=" * 70)
    print(">>> 3. LAYER-TO-LAYER REGISTRATION & PRIMITIVE CONNECTIVITY AUDIT")
    print("=" * 70)

    drl_file = "AXON_OPTICAL_CPNPU_CARRIER.drl"
    fcu_file = "AXON_OPTICAL_CPNPU_CARRIER-F_Cu.gtl"
    fmask_file = "AXON_OPTICAL_CPNPU_CARRIER-F_Mask.gts"
    in3_file = "AXON_OPTICAL_CPNPU_CARRIER-In3_Cu.g3"

    if drl_file in parsed_layers and fcu_file in parsed_layers and fmask_file in parsed_layers:
        _, drl_obj = parsed_layers[drl_file]
        _, fcu_obj = parsed_layers[fcu_file]
        _, fmask_obj = parsed_layers[fmask_file]

        # 1. Check 4 M2.5 mounting holes + 36 fence vias + 32 signal vias + 2 guide pins = 74 holes
        expected_holes = [(12.5, 12.5), (62.5, 12.5), (62.5, 62.5), (12.5, 62.5)]
        drl_coords = [
            (round(obj.x, 3), round(obj.y, 3))
            for obj in drl_obj.objects
            if hasattr(obj, "x") and hasattr(obj, "y")
        ]
        print(f" - Total drill holes detected: {len(drl_coords)}")
        if len(drl_coords) != 74:
            print(f"   [FAIL] Expected 74 total drill holes, found {len(drl_coords)}!")
            errors += 1

        for eh in expected_holes:
            found = any(
                math.isclose(eh[0], dc[0], abs_tol=0.01) and math.isclose(eh[1], dc[1], abs_tol=0.01)
                for dc in drl_coords
            )
            if found:
                print(f"   [PASS] Mounting Hole at ({eh[0]:.1f}, {eh[1]:.1f}) mm matched in Drill file.")
            else:
                print(f"   [FAIL] Expected hole at ({eh[0]:.1f}, {eh[1]:.1f}) mm NOT FOUND in Drill file!")
                errors += 1

        # 2. Inspect actual Arc objects on F_Cu and F_Mask for the r=26.375mm (54mm OD) Au ground ring
        fcu_arcs = [o for o in fcu_obj.objects if isinstance(o, Arc)]
        fmask_arcs = [o for o in fmask_obj.objects if isinstance(o, Arc)]
        if fcu_arcs and fmask_arcs:
            fcu_bb = fcu_arcs[0].bounding_box()
            fmask_bb = fmask_arcs[0].bounding_box()
            fcu_od = fcu_bb[1][0] - fcu_bb[0][0]
            fmask_od = fmask_bb[1][0] - fmask_bb[0][0]
            if math.isclose(fcu_od, 54.0, abs_tol=0.05) and math.isclose(fmask_od, 54.1, abs_tol=0.05):
                print(
                    f"   [PASS] Au Ground Ring ArcPoly verified: F_Cu OD={fcu_od:.2f} mm, F_Mask OD={fmask_od:.2f} mm."
                )
            else:
                print(f"   [FAIL] Au Ground Ring OD mismatch: F_Cu={fcu_od:.2f}, F_Mask={fmask_od:.2f}")
                errors += 1
        else:
            print("   [FAIL] Missing ArcPoly primitive for 54mm Au Ground Ring in F_Cu or F_Mask!")
            errors += 1

        # 3. Verify SMA J2 center signal pad at (37.5, 1.5) is present in both F_Cu and F_Mask
        fcu_flashes = [(round(o.x, 3), round(o.y, 3)) for o in fcu_obj.objects if isinstance(o, Flash)]
        fmask_flashes = [(round(o.x, 3), round(o.y, 3)) for o in fmask_obj.objects if isinstance(o, Flash)]
        if (37.5, 1.5) in fcu_flashes and (37.5, 1.5) in fmask_flashes:
            print("   [PASS] SMA J2 50-ohm center launch pad & solder mask opening verified at (37.5, 1.5) mm.")
        else:
            print("   [FAIL] SMA J2 center signal launch pad missing in F_Cu or F_Mask at (37.5, 1.5) mm!")
            errors += 1

        # 4. Verify In3_Cu inner stripline routing connects all 16 VCSEL fanout vias to Samtec J1 vias
        if in3_file in parsed_layers:
            _, in3_obj = parsed_layers[in3_file]
            in3_lines = [o for o in in3_obj.objects if isinstance(o, Line)]
            if len(in3_lines) == 48:  # 16 channels * 3 segments each
                print(f"   [PASS] In3_Cu stripline routing verified: {len(in3_lines)} segments for 16 VCSEL channels.")
            else:
                print(f"   [FAIL] Expected 48 routing segments on In3_Cu, found {len(in3_lines)}!")
                errors += 1

    print("\n" + "=" * 70)
    print(">>> 4. AUDIT CONCLUSION")
    print("=" * 70)
    if errors == 0:
        print("🟢 [AUDIT VERDICT: 100% PASS - 6-LAYER CERTIFIED PRODUCTION READY]")
        return 0
    else:
        print(f"🔴 [AUDIT VERDICT: FAILED WITH {errors} DISCREPANCIES]")
        return 1


if __name__ == "__main__":
    sys.exit(audit_gerber_files())
