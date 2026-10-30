import hashlib
from pathlib import Path
import tempfile
import unittest

from release_integrity import safe_relative, verify_manifest, write_manifest


class ReleaseIntegrityTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        (self.root / "source.py").write_text("original\n", encoding="utf-8")
        (self.root / "results").mkdir()
        (self.root / "results/snapshot.json").write_text("{}\n", encoding="utf-8")
        write_manifest(self.root, "source")
        write_manifest(self.root, "snapshot")

    def test_clean_release(self):
        for kind in ("source", "snapshot"):
            self.assertEqual(verify_manifest(self.root, kind)["status"], "PASS")

    def test_reexecution_outside_snapshot_does_not_break_hashes(self):
        (self.root / "runs/latest").mkdir(parents=True)
        (self.root / "runs/latest/test.log").write_text("new run\n", encoding="utf-8")
        self.test_clean_release()

    def test_modified_snapshot_does_not_change_source_status(self):
        (self.root / "results/snapshot.json").write_text("changed\n", encoding="utf-8")
        self.assertEqual(verify_manifest(self.root, "source")["status"], "PASS")
        self.assertEqual(verify_manifest(self.root, "snapshot")["status"], "FAIL")

    def test_modified_source_blocks(self):
        (self.root / "source.py").write_text("tampered\n", encoding="utf-8")
        self.assertEqual(verify_manifest(self.root, "source")["status"], "FAIL")

    def test_missing_or_unlisted_source_blocks(self):
        (self.root / "new.py").write_text("extra\n", encoding="utf-8")
        self.assertEqual(verify_manifest(self.root, "source")["status"], "FAIL")
        (self.root / "new.py").unlink()
        (self.root / "source.py").unlink()
        self.assertEqual(verify_manifest(self.root, "source")["status"], "FAIL")

    def test_duplicate_or_malformed_manifest_blocks(self):
        p = self.root / "SOURCE_SHA256SUMS.txt"
        original = p.read_text()
        for content in (original + original, "broken\n", ""):
            p.write_text(content, encoding="utf-8")
            self.assertEqual(verify_manifest(self.root, "source")["status"], "FAIL")

    def test_portable_paths_reject_escape_and_windows_paths(self):
        for path in ("../x", "/x", "C:/x", "C:x", "a\\b", "a/../x", "a//b", "./x"):
            self.assertFalse(safe_relative(path), path)
        self.assertTrue(safe_relative("data/raw.log"))

    def test_source_manifest_is_covered_by_snapshot(self):
        p = self.root / "SOURCE_SHA256SUMS.txt"
        p.write_text(p.read_text() + "bad\n", encoding="utf-8")
        self.assertEqual(verify_manifest(self.root, "snapshot")["status"], "FAIL")
