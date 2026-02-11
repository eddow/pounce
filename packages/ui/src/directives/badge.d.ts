import type { Variant } from '../shared/variants';
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type BadgeOptions = {
    value: string | number | JSX.Element;
    position?: BadgePosition;
    variant?: Variant;
    class?: string;
};
export type BadgeInput = string | number | JSX.Element | BadgeOptions;
/**
 * A directive that adds a badge to an element.
 * Use as use:badge={value} or use:badge={{ value, position: 'top-left' }}
 */
export declare function badge(target: Node | Node[], input: BadgeInput): (() => void) | undefined;
//# sourceMappingURL=badge.d.ts.map