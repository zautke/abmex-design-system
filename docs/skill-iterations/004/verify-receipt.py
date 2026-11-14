#!/usr/bin/env python3
"""Compare a saved CodeMunch symbol response with current and pinned Git bytes."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent


def Usage() -> str:
    return (
        "Usage: verify-receipt.py --repo-root PATH [--response PATH] "
        "[--metadata PATH] [--self-check]\n"
        "       verify-receipt.py --help\n"
        "Options: -r/--repo-root, -s/--response, -m/--metadata, -c/--self-check, -h/--help"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, usage=Usage())
    parser.add_argument("-r", "--repo-root", help="Git checkout containing current source")
    parser.add_argument(
        "-s", "--response", default=str(HERE / "receipt-codemunch-response.json"),
        help="Saved complete CodeMunch tool response JSON",
    )
    parser.add_argument(
        "-m", "--metadata", default=str(HERE / "receipt-symbol-metadata.json"),
        help="Saved subject, immutable revision, and explicit wrapper metadata JSON",
    )
    parser.add_argument(
        "-c", "--self-check", action="store_true",
        help="Run scoped synthetic comparisons, including four expected negatives",
    )
    args = parser.parse_args()
    if not args.self_check and not args.repo_root:
        parser.error("--repo-root is required unless --self-check is used")
    return args


def load_response(path: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    outer = json.loads(path.read_text(encoding="utf-8"))
    blocks = outer.get("content", [])
    if not blocks or not isinstance(blocks[0].get("text"), str):
        raise ValueError("saved response has no text content block")
    response = json.loads(blocks[0]["text"])
    if not isinstance(response.get("source"), str):
        raise ValueError("saved CodeMunch response has no complete source string")
    meta = response.get("_meta", {}).get("receipts", {})
    if not meta.get("ids"):
        raise ValueError("saved response has no immutable evidence receipt ID")
    return response, outer


def git_blob(repo_root: Path, revision: str, file_path: str) -> bytes:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "show", f"{revision}:{file_path}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"git show could not resolve {revision}:{file_path}: {detail}")
    return result.stdout


def locate_symbol(
    data: bytes,
    body: bytes,
    wrapper: bytes,
    expected_line: int | None = None,
    expected_end_line: int | None = None,
) -> dict[str, Any]:
    positions: list[int] = []
    start = 0
    while True:
        found = data.find(body, start)
        if found < 0:
            break
        positions.append(found)
        start = found + 1
    attached = [p for p in positions if p >= len(wrapper) and data[p - len(wrapper):p] == wrapper]
    lines = [data[:p].count(b"\n") + 1 for p in positions]
    end_lines = [line + body.count(b"\n") for line in lines]
    return {
        "body_occurrences": len(positions),
        "body_found": bool(positions),
        "wrapper_attached": len(attached) == 1,
        "wrapper_match_count": len(attached),
        "body_start_lines": lines,
        "body_end_lines": end_lines,
        "span_matches": (
            (expected_line is None or expected_line in lines)
            and (expected_end_line is None or expected_end_line in end_lines)
        ),
    }


def compare(
    body: bytes,
    pinned: bytes,
    current: bytes,
    wrapper: bytes,
    expected_line: int | None = None,
    expected_end_line: int | None = None,
) -> dict[str, Any]:
    pin = locate_symbol(pinned, body, wrapper, expected_line, expected_end_line)
    work = locate_symbol(current, body, wrapper, expected_line, expected_end_line)
    return {
        "returned_body_matches_pinned_symbol_bytes": pin["wrapper_attached"] and pin["span_matches"],
        "returned_body_exists_in_current_file": work["body_found"],
        "returned_body_start_lines_pinned": pin["body_start_lines"],
        "returned_body_start_lines_current": work["body_start_lines"],
        "returned_body_end_lines_pinned": pin["body_end_lines"],
        "returned_body_end_lines_current": work["body_end_lines"],
        "returned_line_span_matches": pin["span_matches"] and work["span_matches"],
        "pinned_symbol_has_explicit_wrapper": pin["wrapper_attached"],
        "current_symbol_has_explicit_wrapper": work["wrapper_attached"],
        "public_api_wrapper_identity": pin["wrapper_attached"] and work["wrapper_attached"],
        "current_file_matches_pinned_git_blob": current == pinned,
        "body_sha256": hashlib.sha256(body).hexdigest(),
        "pinned_file_sha256": hashlib.sha256(pinned).hexdigest(),
        "current_file_sha256": hashlib.sha256(current).hexdigest(),
    }


def run_self_check() -> int:
    body = b"function RootLayout() { return null; }"
    wrapper = b"export default "
    pinned = b"import x from 'x';\n" + wrapper + body + b"\n"
    base = compare(body, pinned, pinned, wrapper, expected_line=2, expected_end_line=2)
    assert base["returned_body_matches_pinned_symbol_bytes"]
    assert base["current_file_matches_pinned_git_blob"]
    print("PASS synthetic baseline: body, wrapper, and pinned/current bytes agree")

    changed_body = compare(body + b" ", pinned, pinned, wrapper, expected_line=2, expected_end_line=2)
    assert not changed_body["returned_body_matches_pinned_symbol_bytes"]
    print("PASS synthetic negative: changed returned body rejected")

    altered_export = pinned.replace(wrapper + body, b"export function " + body, 1)
    altered = compare(body, pinned, altered_export, wrapper, expected_line=2, expected_end_line=2)
    assert not altered["public_api_wrapper_identity"]
    assert not altered["current_file_matches_pinned_git_blob"]
    print("PASS synthetic negative: altered export wrapper rejected")

    adjacent_byte = compare(body, pinned, pinned + b" ", wrapper, expected_line=2, expected_end_line=2)
    assert adjacent_byte["current_symbol_has_explicit_wrapper"]
    assert not adjacent_byte["current_file_matches_pinned_git_blob"]
    print("PASS synthetic negative: adjacent working-file byte rejected")

    try:
        git_blob(HERE, "0" * 40, "receipt-unavailable-fixture.tsx")
    except RuntimeError:
        print("PASS synthetic negative: unavailable immutable revision rejected")
    else:
        raise AssertionError("unavailable revision unexpectedly resolved")

    wrong_span = compare(body, pinned, pinned, wrapper, expected_line=2, expected_end_line=3)
    assert not wrong_span["returned_line_span_matches"]
    print("PASS synthetic negative: incorrect returned end line rejected")

    actual_revision = "c0b0e5f82973b8a5c929d05f58cef48463bc7b73"
    assert revisions_match(actual_revision, actual_revision)
    assert not revisions_match(actual_revision, "1" * 40)
    print("PASS synthetic negative: response/metadata Git revision mismatch rejected")
    return 0


def revisions_match(response_revision: str | None, metadata_revision: str | None) -> bool:
    return bool(response_revision and metadata_revision and response_revision == metadata_revision)


def main() -> int:
    args = parse_args()
    if args.self_check:
        return run_self_check()

    response_path = Path(args.response)
    metadata_path = Path(args.metadata)
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    response, _outer = load_response(response_path)
    if response.get("id") != metadata.get("symbol_id"):
        raise ValueError("saved response symbol ID does not match metadata")
    revision = metadata["immutable_revision"]
    file_path = metadata["file_path"]
    wrapper = metadata["wrapper_prefix"].encode("utf-8")
    body = response["source"].encode("utf-8")
    repo_root = Path(args.repo_root).resolve()
    pinned = git_blob(repo_root, revision, file_path)
    current = (repo_root / file_path).read_bytes()
    result = compare(
        body,
        pinned,
        current,
        wrapper,
        expected_line=response.get("line"),
        expected_end_line=response.get("end_line"),
    )
    result["response_revision_matches_metadata"] = revisions_match(
        response.get("git_sha_rev"), revision
    )
    result.update({
        "repository": metadata["repository"],
        "file_path": file_path,
        "symbol_id": response["id"],
        "symbol_line_span": [response.get("line"), response.get("end_line")],
        "immutable_revision": revision,
        "wrapper_prefix": metadata["wrapper_prefix"],
        "wrapper_basis": metadata["wrapper_basis"],
        "content_verified": response.get("content_verified"),
        "git_sha_verification": response.get("git_sha_verification"),
        "git_sha_rev": response.get("git_sha_rev"),
        "freshness": response.get("_freshness"),
        "receipt_ids": response.get("_meta", {}).get("receipts", {}).get("ids", []),
        "scope_note": (
            "Body identity compares returned symbol bytes with the immutable Git symbol span. "
            "Public API identity checks the explicit export wrapper in current and pinned source; "
            "CodeMunch returned a function body without that wrapper. This local comparison does "
            "not override or explain CodeMunch's git_sha_verification field."
        ),
    })
    print(json.dumps(result, indent=2, sort_keys=True))
    required = (
        "returned_body_matches_pinned_symbol_bytes",
        "returned_line_span_matches",
        "current_file_matches_pinned_git_blob",
        "public_api_wrapper_identity",
        "response_revision_matches_metadata",
    )
    return 0 if all(result[key] for key in required) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, RuntimeError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        print(Usage(), file=sys.stderr)
        raise SystemExit(2)
