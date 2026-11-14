# ESI004 CodeMunch receipt comparison

Captured complete raw responses in `receipt-codemunch-outline.json` and `receipt-codemunch-response.json`. The source request was `get_symbol_source` for `apps/web/src/app/layout.tsx::RootLayout#function`, with `verify=true`, `verify_against=git_sha`, and `receipt=true`.

## Recorded receipt

- Repository: `zautke/labsupapg`
- Subject: `apps/web/src/app/layout.tsx::RootLayout#function`, lines 17–29
- Immutable revision: `c0b0e5f82973b8a5c929d05f58cef48463bc7b73`
- Returned body SHA-256: `dd328f9b03efe55c0ce911ac8728285765709e1e3da02c7c26149e6c3be46e8b`
- Evidence receipt: `sha256:40a3f7b9ee7ff16a01bfb3692c4c1f188a917340ea4dcd87896cddf5556dcf57`
- Tool fields: `content_verified=true`, `_freshness=fresh`, `git_sha_verification=git_sha_mismatch`

## Independent byte comparison

`verify-receipt.py` reads the saved response and `receipt-symbol-metadata.json`, then compares the returned symbol bytes and reported start/end lines with the immutable `git show` blob and current working file. It also requires `git_sha_rev` in the response to equal the metadata revision. It checks the export boundary with explicit `export default ` wrapper metadata. Returned body matches pinned/current symbol bytes at lines 17–29. Current file exactly matches pinned blob. The one observed wrapper is present adjacent to the returned function in both byte sequences. Whole-file SHA-256 is `3054bea58c827312fd9491fb0bfcb97972861fe7f645e1a9e74599096273e87e` for both pinned and current bytes.

This establishes returned-body identity and observes one matching export wrapper in current/pinned bytes for this subject; it is not complete proof of the module's public API. The response's `git_sha_mismatch` remains a recorded unresolved tool field; this local comparison does not override or explain it. These checks do not establish broader CodeMunch verification efficacy or skill-promotion criteria.

## Synthetic comparison checks

`verify-receipt.py --self-check` passed its baseline and rejected six synthetic cases: changed returned body, unavailable Git revision, altered export wrapper, adjacent working-file byte, incorrect end line, and response/metadata revision mismatch. These are checker fixtures only; they are not additional CodeMunch calls or mutations of the source repository.
