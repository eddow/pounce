import type { Plugin } from 'vite';
/**
 * Vite plugin for @pounce/ui
 * 1. Wraps css`...` and sass`...` tagged templates in @layer pounce.components
 * 2. Validates that only --pounce-* variables are used
 * 3. Auto-prepends @use for SASS variables with correct relative path
 */
export declare function pounceUIPlugin(): Plugin;
