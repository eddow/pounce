import { isReactive } from 'mutts'

export class AttributeChain {
	private layers: object[]

	constructor(...layers: object[]) {
		this.layers = layers.filter((l) => l != null)
	}

	get keys(): Set<string> {
		const keys = new Set<string>()
		for (const layer of this.layers) {
			for (const key of Reflect.ownKeys(layer)) {
				if (typeof key === 'string') keys.add(key)
			}
		}
		return keys
	}

	get(key: string): any {
		if (key === 'class') {
			return this.mergeClasses()
		}
		if (key === 'style') {
			return this.mergeStyles()
		}

		// Reverse iteration for precedence (last one wins)
		for (let i = this.layers.length - 1; i >= 0; i--) {
			const layer = this.layers[i]
			if (Object.hasOwn(layer, key) || key in layer) {
				return (layer as any)[key]
			}
		}
		return undefined
	}

	// TODO: improve by checking getters/descriptors
	get isReactive(): boolean {
		return this.layers.some(isReactive)
	}

	private mergeClasses(): any[] {
		// TODO: make correctly+verify
		const classes: any[] = []
		for (const layer of this.layers) {
			if ('class' in layer) {
				const val = (layer as any).class
				if (Array.isArray(val)) classes.push(...val)
				else if (val) classes.push(val)
			}
		}
		return classes
	}

	private mergeStyles(): object {
		// TODO: make correctly+verify
		const styleObj = {}
		for (const layer of this.layers) {
			if ('style' in layer) {
				const val = (layer as any).style
				if (val && typeof val === 'object') Object.assign(styleObj, val)
				// TODO: Handle string styles?
			}
		}
		// Return array for pounce style handler? or merged object?
		// Traits system returned array of styles. Let's return array to be safe if that's what renderer expects.
		// Actually, let's stick to collection.
		const styles: any[] = []
		for (const layer of this.layers) {
			if ('style' in layer) {
				styles.push((layer as any).style)
			}
		}
		return styles
	}
}
