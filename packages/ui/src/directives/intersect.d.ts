export interface IntersectOptions {
    onEnter?: (entry: IntersectionObserverEntry) => void;
    onLeave?: (entry: IntersectionObserverEntry) => void;
    onChange?: (entry: IntersectionObserverEntry) => void;
    root?: HTMLElement | null;
    rootMargin?: string;
    threshold?: number | number[];
}
export declare function intersect(target: Node | Node[], value: IntersectOptions, _scope: Record<PropertyKey, any>): (() => void) | undefined;
//# sourceMappingURL=intersect.d.ts.map