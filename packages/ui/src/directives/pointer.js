function isObject(value) {
    return value && typeof value === 'object';
}
export function pointer(target, value, _scope) {
    const element = Array.isArray(target) ? target[0] : target;
    if (!(element instanceof HTMLElement))
        return;
    const handleMove = (e) => {
        const state = {
            x: e.offsetX,
            y: e.offsetY,
            buttons: e.buttons,
        };
        if (isObject(value) && 'value' in value)
            value.value = state;
    };
    const handleLeave = () => {
        if (isObject(value) && 'value' in value)
            value.value = undefined;
    };
    const handleDown = (e) => {
        element.setPointerCapture(e.pointerId);
        handleMove(e);
    };
    const handleUp = (e) => {
        element.releasePointerCapture(e.pointerId);
        handleMove(e);
    };
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerdown', handleDown);
    element.addEventListener('pointerup', handleUp);
    element.addEventListener('pointerleave', handleLeave);
    return () => {
        element.removeEventListener('pointermove', handleMove);
        element.removeEventListener('pointerdown', handleDown);
        element.removeEventListener('pointerup', handleUp);
        element.removeEventListener('pointerleave', handleLeave);
    };
}
