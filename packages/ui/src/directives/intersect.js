export function intersect(target, value, _scope) {
    const element = Array.isArray(target) ? target[0] : target;
    if (!(element instanceof HTMLElement))
        return;
    const options = {
        root: value.root || null,
        rootMargin: value.rootMargin || '0px',
        threshold: value.threshold || 0,
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (value.onChange)
                value.onChange(entry);
            if (entry.isIntersecting) {
                if (value.onEnter)
                    value.onEnter(entry);
            }
            else {
                if (value.onLeave)
                    value.onLeave(entry);
            }
        });
    }, options);
    observer.observe(element);
    return () => {
        observer.disconnect();
    };
}
