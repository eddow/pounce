# @pounce/kit TODO

## Performance instrumentation

### Route changes (navigation + sync + render)

We now emit perf marks for:
- `route:navigate` (start → end around history push/replace + sync)
- `route:sync` (snapshot creation from `window.location`)
- `route:match` (route matcher evaluation)
- `route:render` (route view render)
- `route:not-found` (fallback render)

### Expected results (targets to validate)

These are initial **targets** to validate with perf logs in real apps (not guarantees):

- **`route:sync`**: **≤ 0.20ms** typical on desktop (URL + history snapshot).
- **`route:match`**: **≤ 0.30ms** for ~20 routes, **≤ 0.80ms** for ~100 routes.
- **`route:render`**: **≤ 2–5ms** for simple pages, **≤ 10–16ms** for heavy pages (dom-heavy views).
- **`route:navigate`** end-to-end (pushState + sync + reactive update): **≤ 2ms** typical when route view is light, **≤ 6ms** when view work dominates.

### Validation steps

1. Run app with `VITE_PERF=true` (and optionally `VITE_PERF_LOG=true` to auto-log).
2. Perform multiple SPA navigations (different route patterns, param changes).
3. Compare measured marks to targets above and note any regression.
4. If `route:match` or `route:sync` exceed targets, profile route table size and URL snapshotting.
5. If `route:render` dominates, inspect view functions for heavy sync work; consider lazy loading or deferring work.
