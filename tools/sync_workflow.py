#!/usr/bin/env python3
"""
AXON Quantum — Local <-> Supabase <-> GitHub Workflow Sync CLI

기능:
  1. --seed      : website/workflow_data.js의 45개 태스크 기본 상태를 Supabase에 초기 적재
  2. --pull      : Supabase에서 최신 태스크 상태 및 실험 로그를 받아 AXON_WORKFLOW_STATUS.md 생성
  3. --complete  : 특정 태스크(예: SIL-04)를 완료 처리하고 Supabase + 실험 로그 + 로컬 스냅샷 동시 갱신
  4. --git-sync  : 변경된 AXON_WORKFLOW_STATUS.md를 git commit & push (선택)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOW_DATA_JS = ROOT / "website" / "workflow_data.js"
WORKFLOW_SUPA_JS = ROOT / "website" / "workflow_supabase.js"
STATUS_MD = ROOT / "AXON_WORKFLOW_STATUS.md"


def load_supabase_config():
    url = os.environ.get("AXON_SUPABASE_URL", "").strip()
    key = os.environ.get("AXON_SUPABASE_KEY", "").strip()
    if url and key:
        return url.rstrip("/"), key

    if WORKFLOW_SUPA_JS.exists():
        text = WORKFLOW_SUPA_JS.read_text(encoding="utf-8")
        m_url = re.search(r"url:\s*'([^']+)'", text)
        m_key = re.search(r"anonKey:\s*'([^']+)'", text)
        if m_url and m_key:
            return m_url.group(1).rstrip("/"), m_key.group(1)

    raise RuntimeError("Supabase URL/Key를 찾을 수 없습니다.")


def parse_workflow_tasks():
    """Node.js를 이용해 website/workflow_data.js의 45개 태스크 메타데이터를 파싱합니다."""
    cmd = [
        "node",
        "-e",
        (
            "global.window={};"
            f"require({json.dumps(str(WORKFLOW_DATA_JS))});"
            "console.log(JSON.stringify(global.window.AXON_WORKFLOW_DATA));"
        ),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding="utf-8")
    return json.loads(proc.stdout)


def supa_request(url, key, path, method="GET", payload=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(f"{url}/rest/v1/{path}", data=data, headers=headers, method=method)
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase HTTP {e.code}: {err_body}") from e


def cmd_seed(url, key, data):
    tasks = data.get("checklist", [])
    rows = [
        {
            "id": t["id"],
            "checked": bool(t.get("defaultChecked", False)),
            "note": t.get("evidenceTag", ""),
            "updated_by": "local-cli-seed",
        }
        for t in tasks
    ]
    supa_request(
        url,
        key,
        "axon_workflow_tasks?on_conflict=id",
        method="POST",
        payload=rows,
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    print(f"[OK] Supabase에 {len(rows)}개 태스크 초기 상태 시드 완료.")


def cmd_complete(url, key, task_id, note, checked=True):
    row = {
        "id": task_id,
        "checked": checked,
        "note": note or "",
        "updated_by": "local-cli",
    }
    supa_request(
        url,
        key,
        "axon_workflow_tasks?on_conflict=id",
        method="POST",
        payload=row,
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    log_row = {
        "task_id": task_id,
        "title": f"{task_id} {'완료' if checked else '미완료 전환'} (Local CLI)",
        "evidence_tier": "[VERIFIED]" if checked else "[TARGET]",
        "notes": note or "",
    }
    supa_request(
        url,
        key,
        "axon_experiment_logs",
        method="POST",
        payload=log_row,
        extra_headers={"Prefer": "return=minimal"},
    )
    print(f"[OK] {task_id} -> checked={checked} (Supabase 및 실험 로그 반영 완료)")


def cmd_pull(url, key, data):
    remote_rows = supa_request(url, key, "axon_workflow_tasks?select=id,checked,note,updated_at")
    logs = supa_request(
        url,
        key,
        "axon_experiment_logs?select=task_id,title,evidence_tier,notes,created_at&order=created_at.desc&limit=15",
    )

    remote_map = {r["id"]: r for r in remote_rows}
    tasks = data.get("checklist", [])
    domains = {d["id"]: d["name"] for d in data.get("domains", [])}

    done_count = 0
    lines = [
        "# AXON Quantum 45-Tasks 실시간 동기화 현황",
        "",
        f"- **동기화 시각 (UTC):** `{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}`",
        f"- **Supabase 프로젝트:** `{url}`",
        "- **웹 대시보드:** https://website-mauve-eight-qp2ijblhwi.vercel.app/workflow.html",
        "",
        "## 도메인별 체크리스트 현황",
        "",
    ]

    for dom_id, dom_name in domains.items():
        dom_tasks = [t for t in tasks if t["domain"] == dom_id]
        dom_done = sum(
            1
            for t in dom_tasks
            if (remote_map[t["id"]]["checked"] if t["id"] in remote_map else t.get("defaultChecked", False))
        )
        done_count += dom_done
        lines.append(f"### {dom_name} ({dom_done}/{len(dom_tasks)})")
        for t in dom_tasks:
            is_done = remote_map[t["id"]]["checked"] if t["id"] in remote_map else t.get("defaultChecked", False)
            mark = "x" if is_done else " "
            lines.append(f"- [{mark}] **`{t['id']}`** ({t['milestone']} · {t['priority']} · `{t['evidenceTag']}`) — {t['title']}")
        lines.append("")

    total = len(tasks)
    pct = round((done_count / total) * 100) if total else 0
    lines.insert(4, f"- **전체 진행률:** **{done_count} / {total} ({pct}%)**")

    if logs:
        lines.append("## 최근 R&D 실험 · 커밋 로그")
        lines.append("")
        for lg in logs:
            tid = f"`{lg['task_id']}` " if lg.get("task_id") else ""
            lines.append(f"- {tid}**{lg['title']}** `{lg.get('evidence_tier', '')}` — {lg.get('notes', '')}")
        lines.append("")

    STATUS_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"[OK] {STATUS_MD.name} 갱신 완료 ({done_count}/{total}, {pct}%).")


def main():
    parser = argparse.ArgumentParser(description="AXON Quantum 45-Tasks Sync CLI")
    parser.add_argument("--seed", action="store_true", help="초기 45개 태스크를 Supabase에 업로드")
    parser.add_argument("--pull", action="store_true", help="Supabase 상태를 로컬 AXON_WORKFLOW_STATUS.md로 동기화")
    parser.add_argument("--complete", metavar="TASK_ID", help="특정 태스크 완료 처리 (예: SIL-04)")
    parser.add_argument("--uncheck", metavar="TASK_ID", help="특정 태스크 미완료 처리")
    parser.add_argument("--note", default="", help="완료/변경 메모")
    args = parser.parse_args()

    url, key = load_supabase_config()
    data = parse_workflow_tasks()

    if args.seed:
        cmd_seed(url, key, data)
    if args.complete:
        cmd_complete(url, key, args.complete.upper(), args.note, checked=True)
    if args.uncheck:
        cmd_complete(url, key, args.uncheck.upper(), args.note, checked=False)
    if args.pull or not (args.seed or args.complete or args.uncheck):
        cmd_pull(url, key, data)


if __name__ == "__main__":
    main()
