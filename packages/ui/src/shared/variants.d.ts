import type { Trait } from '@pounce/core';
export type Variant = string & {};
/**
 * Gets the Trait object for a given variant name from the adapter.
 *
 * Variants are named traits defined in the adapter's central dictionary.
 * The UI package provides no default variants - all variants must come from the adapter.
 *
 * @param variant - Variant name to look up
 * @returns Trait object from adapter.variants, or undefined if not found
 *
 * @example
 * // Adapter defines variants
 * setAdapter({
 *   variants: {
 *     danger: { classes: ['btn-danger'], attributes: { 'aria-live': 'polite' } }
 *   }
 * })
 *
 * // Component uses variant
 * <Button.danger>  // Looks up adapter.variants['danger']
 * <Button variant="danger">  // Same thing
 */
export declare function getVariantTrait(variant: string | undefined): Trait | undefined;
/**
 * Wraps a component in a proxy that treats any property access as a variant flavor.
 * Example: Button.danger(...) -> Button({ variant: 'danger', ... })
 */
export declare function asVariant<T extends (...args: never[]) => any>(component: T): T & Record<string, T>;
//# sourceMappingURL=variants.d.ts.map