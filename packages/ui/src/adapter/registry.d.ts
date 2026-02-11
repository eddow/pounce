import type { ComponentName, FrameworkAdapter, UiComponents } from './types';
import type { Trait } from '@pounce/core';
export declare function setAdapter(...adapters: Partial<FrameworkAdapter>[]): void;
export declare function getAdapter<T extends ComponentName>(component: T): UiComponents[T];
export declare function getGlobalAdapter(): Pick<FrameworkAdapter, 'iconFactory' | 'variants' | 'transitions'>;
export declare function getGlobalVariants(): Record<string, Trait> | undefined;
export declare function resetAdapter(): void;
//# sourceMappingURL=registry.d.ts.map