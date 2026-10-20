"""Index Claude Code transcripts for the /sessions pane.

Usage: python3 -I scan.py <projects-dir> <cache-file>

Prints a JSON list, one object per session that finished at least one turn.
Files whose size and mtime did not change since the last run come from the cache.
"""
import json
import os
import re
import sys

TIMESTAMP = re.compile(r'"timestamp":"([^"]+)"')
CWD = re.compile(r'"cwd":"([^"]+)"')
# Bump when scan() returns other fields, so cached entries are read again.
SCHEMA = 2


def first_prompt_of(entry):
    if entry.get("isMeta") or entry.get("isSidechain"):
        return None
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, list):
        texts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]
        content = " ".join(texts)
    if not isinstance(content, str):
        return None
    text = content.strip()
    if not text or text.startswith("<"):
        return None
    return " ".join(text.split())[:300]


def scan(path):
    info = {
        "id": os.path.basename(path)[: -len(".jsonl")],
        "cwd": None,
        "customTitle": None,
        "aiTitle": None,
        "firstPrompt": None,
        "lastPrompt": None,
        "lastDoneAt": None,
        "lastActivityAt": None,
        "cwds": [],
    }
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if line.startswith('{"type":"api-request'):
                continue
            for cwd in CWD.findall(line):
                if cwd not in info["cwds"]:
                    info["cwds"].append(cwd)
            if '"type":"custom-title"' in line:
                info["customTitle"] = json.loads(line).get("customTitle") or info["customTitle"]
            elif '"type":"ai-title"' in line:
                info["aiTitle"] = json.loads(line).get("aiTitle") or info["aiTitle"]
            elif '"type":"last-prompt"' in line:
                info["lastPrompt"] = " ".join((json.loads(line).get("lastPrompt") or "").split())[:300] or info["lastPrompt"]
            elif '"subtype":"turn_duration"' in line:
                found = TIMESTAMP.search(line)
                if found:
                    info["lastDoneAt"] = found.group(1)
            elif '"type":"assistant"' in line:
                found = TIMESTAMP.search(line)
                if found:
                    info["lastActivityAt"] = found.group(1)
            elif '"type":"user"' in line and (info["firstPrompt"] is None or info["cwd"] is None):
                try:
                    entry = json.loads(line)
                except ValueError:
                    continue
                if entry.get("type") != "user":
                    continue
                info["cwd"] = info["cwd"] or entry.get("cwd")
                if info["firstPrompt"] is None:
                    info["firstPrompt"] = first_prompt_of(entry)
    # Short turns write no turn_duration row, so the last answer counts as a completion too.
    info["lastDoneAt"] = max(filter(None, [info["lastDoneAt"], info["lastActivityAt"]]), default=None)
    return info


def encode(path):
    """The folder name Claude Code keeps a project's transcripts under."""
    return re.sub(r"[^a-zA-Z0-9]", "-", path)


def git_root(path):
    """The repository a directory belongs to, a linked worktree resolved to its main checkout."""
    home = os.path.expanduser("~")
    current = path
    while current and current not in ("/", home):
        dotgit = os.path.join(current, ".git")
        if os.path.isdir(dotgit):
            return current
        if os.path.isfile(dotgit):
            try:
                with open(dotgit, encoding="utf-8") as fh:
                    gitdir = fh.read().strip().removeprefix("gitdir:").strip()
            except OSError:
                return current
            if "/.git/worktrees/" in gitdir:
                return gitdir.split("/.git/worktrees/")[0]
            return current
        current = os.path.dirname(current)
    return None


def origin_of(path, cwds):
    """Where the session's project comes from: the main repository, not a worktree of it."""
    if "/.claude/worktrees/" in path:
        return path.split("/.claude/worktrees/")[0]
    if os.path.isdir(path):
        return git_root(path) or path
    # The directory is gone (a removed worktree): another directory the session worked in may tell.
    for candidate in cwds:
        root = git_root(candidate) if os.path.isdir(candidate) else None
        if root:
            return root
    # A worktree removed since: _workspaces/<repo>/<task> belongs to <repo> beside _workspaces.
    if "/_workspaces/" in path:
        base, rest = path.split("/_workspaces/", 1)
        sibling = os.path.join(base, rest.split("/")[0])
        if os.path.isdir(sibling):
            return git_root(sibling) or sibling
    return path


def place(info, folder):
    cwds = info["cwds"]
    # `claude --resume` finds a session from the directory its transcript is kept under.
    resume = next((c for c in cwds if encode(c) == folder), cwds[0] if cwds else None)
    return {
        "resumeDir": resume,
        "origin": origin_of(resume, cwds) if resume else None,
    }


def main():
    root, cache_path = sys.argv[1], sys.argv[2]
    try:
        with open(cache_path, encoding="utf-8") as fh:
            cache = json.load(fh)
    except (OSError, ValueError):
        cache = {}

    fresh = {}
    rows = []
    for project in sorted(os.listdir(root)):
        folder = os.path.join(root, project)
        if not os.path.isdir(folder):
            continue
        for name in os.listdir(folder):
            if not name.endswith(".jsonl"):
                continue
            path = os.path.join(folder, name)
            try:
                st = os.stat(path)
            except OSError:
                continue
            stamp = [st.st_size, int(st.st_mtime)]
            hit = cache.get(path)
            is_hit = hit and hit.get("stamp") == stamp and hit.get("schema") == SCHEMA
            info = hit["info"] if is_hit else scan(path)
            fresh[path] = {"stamp": stamp, "schema": SCHEMA, "info": info}
            if info["lastDoneAt"]:
                row = {k: v for k, v in info.items() if k != "cwds"}
                rows.append({**row, **place(info, project)})

    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    tmp = cache_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(fresh, fh)
    os.replace(tmp, cache_path)

    rows.sort(key=lambda r: r["lastDoneAt"], reverse=True)
    json.dump(rows, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
