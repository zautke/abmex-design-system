#!/usr/bin/env python3
"""Reproduce frozen ESI002 source-identity receipt without copying donor code."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

def Usage():
    return "Reproduce frozen ESI002 receipt; no positional arguments."

argparse.ArgumentParser(usage=Usage()).parse_args()
root = Path('/Volumes/FLOUNDER/dev/labsupapg')
file = 'apps/web/src/app/dashboard/components/AppSidebar.tsx'
revision = 'c0b0e5f82973b8a5c929d05f58cef48463bc7b73'
expected = 'b0fb0bfbfa38058b235de86988abacef7c0cb723c7f311e4c84d2b2b31997768'
blob = subprocess.check_output(['git', '-C', str(root), 'show', revision + ':' + file])
line_slice = chr(10).join(blob.decode().splitlines()[55:139])
prefix = 'export '
assert line_slice.startswith(prefix), 'Declared export wrapper changed'
body = line_slice[len(prefix):]
actual = hashlib.sha256(body.encode()).hexdigest()
result = {
    'subject': file,
    'symbol_lines': [56, 139],
    'revision': revision,
    'working_file_equals_git_blob': (root / file).read_bytes() == blob,
    'tool_cached_symbol_sha256': expected,
    'git_symbol_body_sha256': actual,
    'git_symbol_body_matches_cached_hash': actual == expected,
    'git_slice_prefix_before_cached_symbol': prefix,
    'git_blob_sha256': hashlib.sha256(blob).hexdigest(),
    'tool_reported_git_sha_mismatch': True,
    'scope': 'this declared symbol body only; no other source or runtime guarantee',
}
assert result['working_file_equals_git_blob']
assert result['git_symbol_body_matches_cached_hash']
print(json.dumps(result, indent=2))
