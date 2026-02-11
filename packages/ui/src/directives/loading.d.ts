/**
 * Loading directive — sets aria-busy, disables form elements, suppresses pointer events.
 *
 * Usage: `<button use:loading={saving}>Submit</button>`
 * Works on any element. PicoCSS renders a native spinner via `[aria-busy="true"]`.
 *
 * Behavior when `true`:
 * - Sets `aria-busy="true"`
 * - Adds adapter's `loading` class (or `pounce-loading` fallback)
 * - Sets `disabled` on form elements (button, input, select, textarea, fieldset)
 * - Suppresses pointer events via CSS
 *
 * The directive is automatically re-called by pounce's `use:` effect when the value changes.
 */
export declare function loading(target: Node | Node[], value: boolean): (() => void) | undefined;
//# sourceMappingURL=loading.d.ts.map