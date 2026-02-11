export type PointerState = {
    x: number;
    y: number;
    buttons: number;
};
export type PointerOptions = {
    value: PointerState | undefined;
};
export declare function pointer(target: Node | Node[], value: any, _scope: Record<PropertyKey, any>): (() => void) | undefined;
//# sourceMappingURL=pointer.d.ts.map