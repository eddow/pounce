import { biDi } from 'mutts';
function isObject(value) {
    return value && typeof value === 'object';
}
export function scroll(target, value, _scope) {
    const element = Array.isArray(target) ? target[0] : target;
    if (!(element instanceof HTMLElement))
        return;
    let provideX;
    let provideY;
    // Setup X-axis binding
    if (value.x !== undefined) {
        if (typeof value.x === 'number') {
            element.scrollLeft = value.x;
        }
        else if (isObject(value.x)) {
            // Two-way binding
            if ('value' in value.x) {
                provideX = biDi((v) => {
                    element.scrollLeft = v;
                }, () => value.x.value, (v) => {
                    ;
                    value.x.value = v;
                });
            }
        }
    }
    // Setup Y-axis binding
    if (value.y !== undefined) {
        if (typeof value.y === 'number') {
            element.scrollTop = value.y;
        }
        else if (isObject(value.y)) {
            // Two-way binding
            if ('value' in value.y) {
                provideY = biDi((v) => {
                    element.scrollTop = v;
                }, () => value.y.value, (v) => {
                    ;
                    value.y.value = v;
                });
            }
        }
    }
    const updateMax = () => {
        if (isObject(value.x) && 'max' in value.x) {
            const max = element.scrollWidth - element.clientWidth;
            if (value.x.max !== max)
                value.x.max = max;
        }
        if (isObject(value.y) && 'max' in value.y) {
            const max = element.scrollHeight - element.clientHeight;
            if (value.y.max !== max)
                value.y.max = max;
        }
    };
    // Update loop handling
    const handleScroll = () => {
        const x = element.scrollLeft;
        const y = element.scrollTop;
        if (provideX)
            provideX(x);
        else if (isObject(value.x) && 'value' in value.x && value.x.value !== x)
            value.x.value = x;
        if (provideY)
            provideY(y);
        else if (isObject(value.y) && 'value' in value.y && value.y.value !== y)
            value.y.value = y;
    };
    // Listeners
    element.addEventListener('scroll', handleScroll);
    // We need to update max on resize (content or container)
    const resizeObserver = new ResizeObserver(() => {
        updateMax();
        // Also re-check scroll position validity if bounds changed?
        // Browser handles clamping, but we might want to sync the clamped value?
        // biDi/handleScroll should take care of sync if the browser clamps it.
    });
    resizeObserver.observe(element);
    // If we are tracking 'max', we must observe content size changes to keep it accurate.
    // We assume the content is the first child.
    const shouldObserveContent = (isObject(value.x) && 'max' in value.x) || (isObject(value.y) && 'max' in value.y);
    if (shouldObserveContent) {
        const content = element.firstElementChild;
        if (content) {
            resizeObserver.observe(content);
        }
    }
    // Initial max calc
    updateMax();
    return () => {
        element.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
    };
}
