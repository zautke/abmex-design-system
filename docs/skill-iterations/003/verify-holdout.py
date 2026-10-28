#!/usr/bin/env python3
"""Reproduce frozen RootLayout identity and declared non-mutating negative checks."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

def Usage():
    return "Reproduce ESI003 frozen holdout; no positional arguments."

argparse.ArgumentParser(usage=Usage()).parse_args()
root = Path('/Volumes/FLOUNDER/dev/labsupapg')
file = 'apps/web/src/app/layout.tsx'
revision = 'c0b0e5f82973b8a5c929d05f58cef48463bc7b73'
expected = 'dd328f9b03efe55c0ce911ac8728285765709e1e3da02c7c26149e6c3be46e8b'
blob = subprocess.check_output(['git', '-C', str(root), 'show', revision + ':' + file])
working = (root / file).read_bytes()
span = chr(10).join(blob.decode().splitlines()[16:29])
prefix = 'export default '
assert span.startswith(prefix)
body = span[len(prefix):]
assert hashlib.sha256(body.encode()).hexdigest() == expected
assert working == blob
missing = subprocess.run(['git', '-C', str(root), 'cat-file', '-e',
                          '0000000000000000000000000000000000000000^{commit}'],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
checks = {
    'actual_default_export_body_identity': True,
    'changed_body_hash_rejected': hashlib.sha256((body + '// synthetic change').encode()).hexdigest() != expected,
    'unavailable_revision_unresolved': missing.returncode != 0,
    'changed_export_not_api_equivalent': 'export ' + body != span,
    'changed_working_bytes_not_current_identity': working + b'// synthetic adjacent edit' != blob,
}
assert all(checks.values())
print(json.dumps({'subject': file, 'revision': revision, 'body_sha256': expected,
                  'explicit_wrapper': prefix, 'checks': checks,
                  'limits': 'primary checker only; no fresh-agent/control or public API proof'}, indent=2))
