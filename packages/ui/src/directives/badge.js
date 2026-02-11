import { bindApp, h, Fragment } from '@pounce/core';
import { getVariantTrait } from '../shared/variants';
function isBadgeOptions(input) {
    return typeof input === 'object' && input !== null && 'value' in input && !('render' in input);
}
/**
 * A directive that adds a badge to an element.
 * Use as use:badge={value} or use:badge={{ value, position: 'top-left' }}
 */
export function badge(target, input) {
    const element = Array.isArray(target) ? target[0] : target;
    if (!(element instanceof HTMLElement))
        return;
    // Parse input
    const options = isBadgeOptions(input) ? input : { value: input };
    const position = options.position ?? 'top-right';
    const variant = options.variant;
    // Apply styles to host
    const originalOverflow = element.style.overflow;
    element.classList.add('pounce-badged');
    element.classList.add(`pounce-badged-${position}`);
    // Create badge container
    const badgeElement = document.createElement('span');
    badgeElement.className = 'pounce-badge-floating';
    if (options.class) {
        for (const cls of options.class.split(' ')) {
            if (cls)
                badgeElement.classList.add(cls);
        }
    }
    if (variant) {
        const trait = getVariantTrait(variant);
        if (trait?.classes) {
            if (Array.isArray(trait.classes)) {
                for (const cls of trait.classes) {
                    if (cls)
                        badgeElement.classList.add(cls);
                }
            }
            else {
                for (const [cls, enabled] of Object.entries(trait.classes)) {
                    if (enabled && cls)
                        badgeElement.classList.add(cls);
                }
            }
        }
        if (trait?.attributes) {
            for (const [k, v] of Object.entries(trait.attributes))
                badgeElement.setAttribute(k, String(v));
        }
    }
    badgeElement.setAttribute('aria-hidden', 'true');
    element.appendChild(badgeElement);
    // Render content into badge
    // jsx elements need bindApp to be reactive if they contain such logic
    const content = options.value;
    const jsxContent = typeof content === 'object' && content !== null && 'render' in content
        ? content
        : h(Fragment, {}, String(content));
    const unbind = bindApp(jsxContent, badgeElement);
    return () => {
        if (typeof unbind === 'function')
            unbind();
        badgeElement.remove();
        element.classList.remove('pounce-badged');
        element.classList.remove(`pounce-badged-${position}`);
        element.style.overflow = originalOverflow;
    };
}
