# @pounce/ui Performance Estimates

This document outlines expected performance characteristics and benchmarks for @pounce/ui components.

## Performance Instrumentation

Performance tracking is implemented using the `perf` utility from `@pounce/utils/perf`. Key components have markers for:

### InfiniteScroll
- `infinitescroll:compute` - Visible range calculation (binary search)
- `infinitescroll:height` - Total height computation
- `infinitescroll:render` - Full render cycle
- `infinitescroll:flush` - ResizeObserver batch processing

### Overlays
- `overlay:show` - Overlay push start
- `overlay:render` - Overlay rendered to DOM
- `overlay:close` - Overlay close start
- `overlay:{mode}:lifecycle` - Full overlay lifecycle (show→close)
- `overlay:{mode}:show` - Show phase (show→render)

### Button
- `button:click` - Click handler execution time

## Expected Performance Metrics

### InfiniteScroll (Virtual Scrolling)

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Fixed-height compute (10k items) | < 0.1ms | O(1) arithmetic |
| Variable-height compute (10k items) | < 0.5ms | O(log n) binary search |
| Height recalculation (variable) | < 1ms | Prefix sum rebuild |
| Render 50 visible items | < 5ms | DOM operations dominate |
| Scroll event handling | < 0.1ms | Direct property access |

**Rationale**: 
- Fixed mode uses simple arithmetic: `start = floor(scrollTop / itemHeight)`
- Variable mode uses Float64Array and binary search on cached offsets
- ResizeObserver batching with requestAnimationFrame prevents layout thrashing

### Overlays

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Dialog show | < 10ms | DOM insertion + transition start |
| Toast show | < 5ms | Simple DOM insertion |
| Drawer show | < 10ms | DOM insertion + animation |
| Overlay close | < 5ms | Class removal + cleanup |

**Rationale**:
- Overlay manager uses efficient array operations for stack management
- Transitions are CSS-based, minimal JS overhead
- Z-index management is O(1) per overlay

### Button

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Click handler | < 1ms | Simple wrapper + user code |
| Render (with icon) | < 2ms | Icon factory lookup + DOM |
| Variant application | < 0.1ms | Trait lookup in adapter |

**Rationale**:
- Click tracking adds minimal overhead (2 perf.mark calls)
- Icon rendering uses cached factory lookups
- Variant traits are pre-computed objects

## Performance Testing

Run performance tests with:
```bash
pnpm test --run tests/performance
```

### Manual Performance Measurement

```javascript
import { perf } from '@pounce/utils/perf'

// Enable performance tracking
perf.setEnabled(true)

// Clear previous measurements
perf.clear()

// Run your UI operations
// ... interact with components

// Get measurements
const buttonClicks = perf.getEntriesByName('button:click')
const scrollCompute = perf.getEntriesByName('infinitescroll:compute')

// Analyze
console.log('Average button click:', 
  buttonClicks.reduce((sum, m) => sum + m.duration, 0) / buttonClicks.length)
```

## Performance Guidelines

### Do
- Use `InfiniteScroll` for lists > 100 items
- Leverage CSS transitions for animations
- Batch DOM updates when possible
- Use component variants for styling (pre-computed)

### Don't
- Render > 1000 items without virtualization
- Trigger layout reads in tight loops
- Create unnecessary reactive dependencies
- Use inline functions in render loops

## Known Performance Characteristics

1. **Direct DOM Manipulation**: Pounce's direct DOM approach is faster than virtual DOM for most UI operations
2. **Reactive Granularity**: Fine-grained reactivity means only changed components re-render
3. **CSS Variable Usage**: All styling uses CSS variables - no runtime style injection
4. **Adapter Pattern**: Adapter lookups are O(1) cached operations

## Future Optimizations

- [ ] Add performance markers to more components (Menu, Toolbar, Forms)
- [ ] Implement render batching for rapid updates
- [ ] Add performance budgets to CI
- [ ] Create performance regression tests
