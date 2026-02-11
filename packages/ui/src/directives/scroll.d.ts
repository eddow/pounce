export type ScrollAxis = number | {
    value: number;
    max: number;
};
export type ScrollOptions = {
    x?: ScrollAxis;
    y?: ScrollAxis;
};
export declare function scroll(target: Node | Node[], value: ScrollOptions, _scope: Record<PropertyKey, any>): (() => void) | undefined;
//# sourceMappingURL=scroll.d.ts.map