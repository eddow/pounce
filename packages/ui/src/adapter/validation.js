import { type } from 'arktype';
const BaseAdaptationSchema = type({
    'classes?': 'object',
    'renderStructure?': 'Function'
});
const IconAdaptationSchema = type({
    'classes?': 'object',
    'renderStructure?': 'Function',
    'iconPlacement?': '"start" | "end"'
});
const OverlayAdaptationSchema = type({
    'classes?': 'object',
    'renderStructure?': 'Function',
    'transitions?': 'object',
    'events?': 'object'
});
const FrameworkAdapterSchema = type({
    'iconFactory?': 'Function',
    'variants?': 'object',
    'transitions?': 'object',
    'components?': 'object'
});
/**
 * Validates adapter configuration at runtime (dev mode only)
 * Throws helpful errors for invalid configurations
 *
 * Supports partial adapters for composition pattern:
 * setAdapter(picoAdapter)
 * setAdapter(iconAdapter)  // Merges with previous
 */
export function validateAdapter(adapter) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    const result = FrameworkAdapterSchema(adapter);
    if (result instanceof type.errors) {
        const errorMessages = result.map(err => {
            return `  - ${err.path.join('.')}: ${err.message}`;
        }).join('\n');
        throw new Error(`[pounce/ui] Invalid adapter configuration:\n${errorMessages}\n\n` +
            `Please check your adapter setup and ensure all fields match their expected types.`);
    }
}
/**
 * Validates component-specific adapter configuration
 * Provides helpful error messages for common mistakes
 */
export function validateComponentAdapter(componentName, adapter) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    const componentSchemas = {
        Button: IconAdaptationSchema,
        Badge: BaseAdaptationSchema,
        Dialog: OverlayAdaptationSchema,
        Dockview: BaseAdaptationSchema,
        ErrorBoundary: BaseAdaptationSchema,
        Layout: BaseAdaptationSchema,
        Menu: BaseAdaptationSchema,
        RadioButton: IconAdaptationSchema,
        Toolbar: BaseAdaptationSchema,
        Typography: BaseAdaptationSchema,
        Heading: BaseAdaptationSchema,
        Text: BaseAdaptationSchema,
        Link: BaseAdaptationSchema
    };
    const schema = componentSchemas[componentName];
    if (!schema) {
        console.warn(`[pounce/ui] Unknown component "${componentName}" in adapter configuration`);
        return;
    }
    const result = schema(adapter);
    if (result instanceof type.errors) {
        const errorMessages = result.map(err => {
            return `  - ${err.path.join('.')}: ${err.message}`;
        }).join('\n');
        console.error(`[pounce/ui] Invalid adapter configuration for "${componentName}":\n${errorMessages}\n\n` +
            `Component "${componentName}" expects specific adaptation fields. Check the documentation.`);
    }
}
