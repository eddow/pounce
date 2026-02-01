export const POUNCE_OWNER = Symbol.for('pounce.owner')

export interface ComponentInfo {
	id: string
	name: string
	ctor: Function
	props: any
	scope: any
	parent?: ComponentInfo
	children: Set<ComponentInfo>
	elements: Set<Node>
}

export const rootComponents = new Set<ComponentInfo>()
/**
 * Returns the component instance (ComponentInfo) that "owns" the given DOM element.
 */
export function getComponentInstance(element: Node): ComponentInfo | undefined {
	return (element as any)[POUNCE_OWNER]
}

/**
 * Returns the component hierarchy starting from the component that owns the given element
 * up to the root component.
 */
export function getComponentHierarchy(element: Node): ComponentInfo[] {
	const hierarchy: ComponentInfo[] = []
	let current = getComponentInstance(element)
	
	while (current) {
		hierarchy.push(current)
		current = current.parent
	}
	
	return hierarchy
}

/**
 * Finds all DOM elements owned by a component instance.
 */
export function getComponentElements(info: ComponentInfo): Node[] {
	return Array.from(info.elements)
}

export class Stack<T> {
	private readonly stack: T[] = []
	enter(value: T) {
		this.stack.push(value)
	}
	exit() {
		this.stack.pop()
	}
	get(): T | undefined {
		return this.stack[this.stack.length - 1]
	}
}