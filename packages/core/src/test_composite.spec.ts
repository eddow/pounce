import { effect, reactive } from 'mutts'
import { CompositeAttributes } from './lib/composite-attributes'

const props = reactive({ disabled: false })

const model = {
	get button() {
		return {
			get disabled() {
				return props.disabled
			},
			get test() {
				return props.disabled ? 'a' : 'b'
			},
		}
	},
}

const attrs = new CompositeAttributes(model.button)

console.log('isReactive BEFORE EFFECT:', attrs.isReactive)
console.log('requiresEffect BEFORE EFFECT:', attrs.requiresEffect('disabled'))

effect(() => {
	console.log('--- Effect Check ---')
	console.log('disabled:', attrs.get('disabled'))
	console.log('test:', attrs.get('test'))
})

console.log('--- SETTING DISABLED TRUE ---')
props.disabled = true

console.log('--- SETTING DISABLED FALSE ---')
props.disabled = false
