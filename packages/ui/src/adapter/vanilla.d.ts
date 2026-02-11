import type { FrameworkAdapter } from './types';
/**
 * Vanilla adapter for @pounce/ui.
 *
 * Provides standard variant traits (primary, secondary, success, danger, warning, contrast)
 * that map to the built-in `--pounce-*` CSS variables and `pounce-variant-*` classes.
 *
 * Components work without any adapter (using hardcoded fallback classes), but installing
 * the vanilla adapter enables:
 * - Variant traits on Button, Badge, Pill, Chip (which have no fallback variant classes)
 * - `data-variant` attributes for CSS targeting
 * - Consistent `--pounce-variant-bg` / `--pounce-variant-color` custom properties
 *
 * Tree-shakeable: only imported when explicitly used.
 *
 * @example
 * ```ts
 * import { setAdapter, vanillaAdapter } from '@pounce/ui'
 * setAdapter(vanillaAdapter)
 * ```
 */
export declare const vanillaAdapter: FrameworkAdapter;
//# sourceMappingURL=vanilla.d.ts.map