"""Separate immutable delivery hashes from repeatable run output. Python >=3.10.

Hashes verify byte identity, not scientific validity or origin authenticity.
--write is a release-building operation; verification never regenerates hashes.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path, PurePosixPath, PureWindowsPath
import re

MANIFESTS = {"source": "SOURCE_SHA256SUMS.txt", "snapshot": "SHA256SUMS.txt"}


def safe_relative(name):
    if not isinstance(name, str) or not name or name != name.strip():
        return False
    posix, win = PurePosixPath(name), PureWindowsPath(name)
    return (not posix.is_absolute() and not win.is_absolute() and not win.drive
            and "\\" not in name and ":" not in name
            and all(p not in {"", ".", ".."} for p in name.split("/")))


def inventory(root, kind):
    if kind not in MANIFESTS:
        raise ValueError("kind must be source or snapshot")
    root = Path(root).resolve()
    names = []
    for path in root.rglob("*"):
        rel = path.relative_to(root)
        if "__pycache__" in rel.parts or path.suffix == ".pyc" or rel.parts[0] == "runs":
            continue
        if kind == "source" and rel.parts[0] == "results":
            continue
        if len(rel.parts) == 1 and (rel.name in MANIFESTS.values()):
            continue
        if path.is_symlink():
            raise ValueError(f"symlink not allowed in release: {rel.as_posix()}")
        if path.is_file():
            names.append(rel.as_posix())
    # The snapshot also covers the separate source manifest.
    if kind == "snapshot" and (root / MANIFESTS["source"]).is_file():
        names.append(MANIFESTS["source"])
    return sorted(names)


def write_manifest(root, kind):
    root = Path(root)
    names = inventory(root, kind)
    lines = [hashlib.sha256((root / name).read_bytes()).hexdigest() + "  " + name for name in names]
    (root / MANIFESTS[kind]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(names)


def verify_manifest(root, kind):
    root = Path(root).resolve()
    problems, seen, matches = [], set(), 0
    try:
        lines = (root / MANIFESTS[kind]).read_text(encoding="utf-8").splitlines()
        if not lines:
            raise ValueError("empty manifest")
        for line in lines:
            match = re.fullmatch(r"([0-9a-fA-F]{64})  (.+)", line)
            if not match:
                problems.append("malformed manifest line")
                continue
            expected, name = match.groups()
            if not safe_relative(name) or name in seen:
                problems.append(f"unsafe or duplicate path: {name}")
                continue
            seen.add(name)
            file = root / name
            if any(p.is_symlink() for p in [file, *file.parents] if p != root and p.is_relative_to(root)):
                problems.append(f"symlink: {name}")
            elif not file.is_file():
                problems.append(f"missing: {name}")
            elif hashlib.sha256(file.read_bytes()).hexdigest() != expected.lower():
                problems.append(f"hash mismatch: {name}")
            else:
                matches += 1
        actual = set(inventory(root, kind))
        if seen != actual:
            problems.append(f"inventory differs; unlisted={sorted(actual-seen)}, unexpected={sorted(seen-actual)}")
    except (OSError, ValueError) as exc:
        problems.append(str(exc))
    return {"kind": kind, "status": "PASS" if not problems else "FAIL",
            "entries": len(seen), "matches": matches, "issues": problems,
            "authenticity": "NOT_AUTHENTICATED"}


def main():
    import json
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kind", choices=MANIFESTS)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    if args.write:
        print(json.dumps({"written": write_manifest(args.root, args.kind), "kind": args.kind}))
        return 0
    result = verify_manifest(args.root, args.kind)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
