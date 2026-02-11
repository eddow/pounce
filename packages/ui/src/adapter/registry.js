import { validateAdapter } from './validation';
let currentAdapter = { components: {} };
let isRendering = false;
export function setAdapter(...adapters) {
    if (isRendering) {
        throw new Error('[pounce/ui] setAdapter() must be called before component rendering.');
    }
    for (const adapter of adapters) {
        validateAdapter(adapter);
        currentAdapter = {
            ...currentAdapter,
            ...adapter,
            // Deep merge for variants and components (accumulative)
            variants: adapter.variants
                ? { ...currentAdapter.variants, ...adapter.variants }
                : currentAdapter.variants,
            components: adapter.components
                ? { ...currentAdapter.components, ...adapter.components }
                : currentAdapter.components
        };
    }
}
export function getAdapter(component) {
    isRendering = true;
    return (currentAdapter.components?.[component] || {});
}
export function getGlobalAdapter() {
    isRendering = true;
    return {
        iconFactory: currentAdapter.iconFactory,
        variants: currentAdapter.variants,
        transitions: currentAdapter.transitions
    };
}
export function getGlobalVariants() {
    return currentAdapter.variants;
}
export function resetAdapter() {
    currentAdapter = { components: {} };
    isRendering = false;
}
