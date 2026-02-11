import type { FrameworkAdapter } from './types';
/**
 * Validates adapter configuration at runtime (dev mode only)
 * Throws helpful errors for invalid configurations
 *
 * Supports partial adapters for composition pattern:
 * setAdapter(picoAdapter)
 * setAdapter(iconAdapter)  // Merges with previous
 */
export declare function validateAdapter(adapter: Partial<FrameworkAdapter>): void;
/**
 * Validates component-specific adapter configuration
 * Provides helpful error messages for common mistakes
 */
export declare function validateComponentAdapter(componentName: string, adapter: any): void;
//# sourceMappingURL=validation.d.ts.map