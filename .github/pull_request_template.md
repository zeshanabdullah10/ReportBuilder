## What and why

<!-- What does this change, and what problem does it solve? Link any related issue. -->

## Checks

- [ ] `cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D warnings` and `cargo test --workspace` pass
- [ ] Desktop changes: `npx tsc -b --noEmit`, `npm test` and `npx playwright test` pass in `desktop/`
- [ ] Tests added or updated for behavior changes
- [ ] Docs updated (README, `docs/`, LabVIEW guide or CHANGELOG) where relevant
