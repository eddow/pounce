import { reactive } from 'mutts'
import { describe, expect, it, vi } from 'vitest'
import { accordionModel } from './models/accordion'
import { buttonModel } from './models/button'
import { checkboxModel, radioModel, switchModel } from './models/checkbox'
import { checkButtonModel } from './models/checkbutton'
import { comboboxModel } from './models/forms'
import {
	appShellModel,
	containerModel,
	gridModel,
	inlineModel,
	spacingValue,
	stackModel,
} from './models/layout'
import { menuBarModel, menuItemModel, menuModel } from './models/menu'
import { multiselectModel } from './models/multiselect'
import { progressModel } from './models/progress'
import { radioButtonModel } from './models/radiobutton'
import { starsModel } from './models/stars'
import { chipModel } from './models/status'
import { headingModel, textModel } from './models/typography'
import { applyTransition, bindDialog, bindToast, createOverlayStack } from './overlays'

// ── Minimal Env stub ─────────────────────────────────────────────────────────

const ltrEnv = { dc: { direction: 'ltr', theme: '', locale: 'en', timeZone: 'UTC' } } as never
const rtlEnv = { dc: { direction: 'rtl', theme: '', locale: 'ar', timeZone: 'UTC' } } as never

// ── buttonModel ─────────────────────────────────────────────────────────────

describe('buttonModel', () => {
	it('returns onClick when not disabled', () => {
		const onClick = vi.fn()
		const model = buttonModel({ onClick })
		expect(model.button.onClick).toBe(onClick)
	})

	it('returns undefined onClick when disabled', () => {
		const model = buttonModel({ disabled: true, onClick: vi.fn() })
		expect(model.button.onClick).toBeUndefined()
	})

	it('isIconOnly when icon present and no children', () => {
		const state = buttonModel({ icon: 'star' })
		expect(state.isIconOnly).toBe(true)
		expect(state.hasLabel).toBe(false)
	})

	it('not isIconOnly when children present', () => {
		const state = buttonModel({ icon: 'star', children: 'Save' })
		expect(state.isIconOnly).toBe(false)
		expect(state.hasLabel).toBe(true)
	})

	it('defaults tag to button', () => {
		expect(buttonModel({}).tag).toBe('button')
	})

	it('icon.position defaults to start', () => {
		expect(buttonModel({ icon: 'x' }).icon?.position).toBe('start')
	})

	it('icon.position passes through end', () => {
		expect(buttonModel({ icon: 'x', iconPosition: 'end' }).icon?.position).toBe('end')
	})

	it('icon.position end unchanged (logical, no env needed)', () => {
		expect(buttonModel({ icon: 'x', iconPosition: 'end' }).icon?.position).toBe('end')
	})

	it('icon is undefined when no icon prop', () => {
		expect(buttonModel({}).icon).toBeUndefined()
	})
})

// ── useCheckbox / useRadio / useSwitch ───────────────────────────────────────

describe('useCheckbox', () => {
	it('input.style.order is -1 by default (label end)', () => {
		expect(checkboxModel({}).input.style.order).toBe(-1)
	})

	it('input.style.order is 0 when labelPosition start', () => {
		expect(checkboxModel({ labelPosition: 'start' }).input.style.order).toBe(0)
	})
})

describe('useRadio', () => {
	it('checked when group === value', () => {
		const state = radioModel({ group: 'a', value: 'a' })
		expect(state.input.checked).toBe(true)
	})

	it('not checked when group !== value', () => {
		const state = radioModel({ group: 'a', value: 'b' })
		expect(state.input.checked).toBe(false)
	})

	it('input.style.order is -1 by default (label end)', () => {
		expect(radioModel({}).input.style.order).toBe(-1)
	})

	it('input.style.order is 0 when labelPosition start', () => {
		expect(radioModel({ labelPosition: 'start' }).input.style.order).toBe(0)
	})
})

describe('useSwitch', () => {
	it('role is always switch', () => {
		expect(switchModel({}).input.role).toBe('switch')
	})

	it('input.style.order is -1 by default (label end)', () => {
		expect(switchModel({}).input.style.order).toBe(-1)
	})

	it('input.style.order is 0 when labelPosition start', () => {
		expect(switchModel({ labelPosition: 'start' }).input.style.order).toBe(0)
	})
})

// ── useCheckButton ───────────────────────────────────────────────────────────

describe('useCheckButton', () => {
	it('role is checkbox', () => {
		expect(checkButtonModel({}).button.role).toBe('checkbox')
	})

	it('toggles checked on click', () => {
		const props = reactive({ checked: false })
		const state = checkButtonModel(props)
		expect(props.checked).toBe(false)
		state.button.onClick!(new MouseEvent('click'))
		expect(props.checked).toBe(true)
	})

	it('calls onCheckedChange on toggle', () => {
		const cb = vi.fn()
		const state = checkButtonModel({ onCheckedChange: cb })
		state.button.onClick!(new MouseEvent('click'))
		expect(cb).toHaveBeenCalledWith(true)
	})

	it('does not toggle when disabled', () => {
		const props = reactive({ disabled: true, checked: false })
		const state = checkButtonModel(props)
		expect(state.button.onClick).toBeUndefined()
		expect(props.checked).toBe(false)
	})
})

// ── useRadioButton ───────────────────────────────────────────────────────────

describe('useRadioButton', () => {
	it('role is radio', () => {
		expect(radioButtonModel({}).button.role).toBe('radio')
	})

	it('checked when group === value', () => {
		expect(radioButtonModel({ group: 'x', value: 'x' }).checked).toBe(true)
	})

	it('onClick undefined when disabled', () => {
		expect(radioButtonModel({ disabled: true, onClick: vi.fn() }).button.onClick).toBeUndefined()
	})
})

// ── useAccordion ─────────────────────────────────────────────────────────────

describe('useAccordion', () => {
	it('exposes open prop', () => {
		expect(accordionModel({ summary: 'Title', open: true }).details.open).toBe(true)
	})

	it('calls onToggle with details.open', () => {
		const cb = vi.fn()
		const state = accordionModel({ summary: 'T', onToggle: cb })
		const el = document.createElement('details')
		el.addEventListener('toggle', state.details.onToggle)
		el.open = true
		el.dispatchEvent(new Event('toggle'))
		expect(cb).toHaveBeenCalledWith(true)
	})
})

// ── useProgress ──────────────────────────────────────────────────────────────

describe('useProgress', () => {
	it('isIndeterminate when value undefined', () => {
		expect(progressModel({}).isIndeterminate).toBe(true)
	})

	it('not indeterminate when value set', () => {
		expect(progressModel({ value: 50 }).isIndeterminate).toBe(false)
	})

	it('defaults max to 100', () => {
		expect(progressModel({}).progress.max).toBe(100)
	})

	it('ariaProps reflect value and max', () => {
		const state = progressModel({ value: 30, max: 200 })
		expect(state.progress['aria-valuenow']).toBe(30)
		expect(state.progress['aria-valuemax']).toBe(200)
	})
})

// ── useCombobox ──────────────────────────────────────────────────────────────

describe('useCombobox', () => {
	it('generates a stable list id on input', () => {
		const state = comboboxModel({})
		expect(state.input.list).toMatch(/^combobox-/)
	})
})

// ── Layout hooks ─────────────────────────────────────────────────────────────

describe('spacingValue', () => {
	it('resolves named tokens', () => {
		expect(spacingValue('none')).toBe('0')
		expect(spacingValue('sm')).toBe('0.5rem')
		expect(spacingValue('md')).toBe('1rem')
	})

	it('passes through custom values', () => {
		expect(spacingValue('2rem')).toBe('2rem')
	})

	it('returns undefined for undefined input', () => {
		expect(spacingValue(undefined)).toBeUndefined()
	})
})

describe('useStack', () => {
	it('defaults gap to md', () => {
		expect(stackModel({}).gap).toBe('1rem')
	})

	it('resolves align to CSS value', () => {
		expect(stackModel({ align: 'start' }).alignItems).toBe('flex-start')
	})

	it('resolves justify to CSS value', () => {
		expect(stackModel({ justify: 'between' }).justifyContent).toBe('space-between')
	})
})

describe('useInline', () => {
	it('defaults gap to sm', () => {
		expect(inlineModel({}).gap).toBe('0.5rem')
	})

	it('defaults align to center', () => {
		expect(inlineModel({}).alignItems).toBe('center')
	})

	it('defaults flexWrap to nowrap', () => {
		expect(inlineModel({}).flexWrap).toBe('nowrap')
	})

	it('wrap=true sets flexWrap to wrap', () => {
		expect(inlineModel({ wrap: true }).flexWrap).toBe('wrap')
	})
})

describe('useGrid', () => {
	it('defaults gap to md', () => {
		expect(gridModel({}).gap).toBe('1rem')
	})

	it('generates repeat columns from number', () => {
		expect(gridModel({ columns: 3 }).gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
	})

	it('passes through string columns', () => {
		expect(gridModel({ columns: '1fr 2fr' }).gridTemplateColumns).toBe('1fr 2fr')
	})

	it('generates auto-fit from minItemWidth', () => {
		expect(gridModel({ minItemWidth: '200px' }).gridTemplateColumns).toBe(
			'repeat(auto-fit, minmax(200px, 1fr))'
		)
	})

	it('returns undefined gridTemplateColumns when not set', () => {
		expect(gridModel({}).gridTemplateColumns).toBeUndefined()
	})
})

describe('useContainer', () => {
	it('defaults to non-fluid div', () => {
		const state = containerModel({})
		expect(state.fluid).toBe(false)
		expect(state.tag).toBe('div')
	})

	it('fluid=true sets fluid', () => {
		expect(containerModel({ fluid: true }).fluid).toBe(true)
	})
})

describe('useAppShell', () => {
	it('shadowOnScroll defaults to true', () => {
		expect(appShellModel({ header: null as never }).shadowOnScroll).toBe(true)
	})

	it('shadowOnScroll=false disables it', () => {
		expect(appShellModel({ header: null as never, shadowOnScroll: false }).shadowOnScroll).toBe(
			false
		)
	})

	it('setupShadow returns a cleanup function', () => {
		const state = appShellModel({ header: null as never })
		const el = document.createElement('header')
		const cleanup = state.setupShadow(el)
		expect(typeof cleanup).toBe('function')
		cleanup()
	})
})

// ── useMultiselect ───────────────────────────────────────────────────────────

describe('useMultiselect', () => {
	it('items reflect checked state from Set', () => {
		const value = new Set(['a'])
		const state = multiselectModel({
			items: ['a', 'b'],
			value,
			renderItem: (item, checked) => `${item}:${checked}` as never,
		})
		expect(state.items[0]!.checked).toBe(true)
		expect(state.items[1]!.checked).toBe(false)
	})

	it('toggle adds item to Set', () => {
		const value = new Set<string>()
		const state = multiselectModel({
			items: ['x'],
			value,
			renderItem: (item) => item as never,
			closeOnSelect: false,
		})
		state.items[0]!.toggle(new MouseEvent('click'))
		expect(value.has('x')).toBe(true)
	})

	it('toggle removes item already in Set', () => {
		const value = new Set(['x'])
		const state = multiselectModel({
			items: ['x'],
			value,
			renderItem: (item) => item as never,
			closeOnSelect: false,
		})
		state.items[0]!.toggle(new MouseEvent('click'))
		expect(value.has('x')).toBe(false)
	})
})

// ── useStars ─────────────────────────────────────────────────────────────────

describe('useStars', () => {
	it('defaults to 5 starItems', () => {
		expect(starsModel({ value: 3 }).starItems.length).toBe(5)
	})

	it('respects maximum', () => {
		expect(starsModel({ value: 2, maximum: 10 }).starItems.length).toBe(10)
	})

	it('readonly defaults to false', () => {
		expect(starsModel({ value: 3 }).readonly).toBe(false)
	})

	it('star status before when index+1 <= value', () => {
		const state = starsModel({ value: 3 })
		expect(state.starItems[0]!.status).toBe('before')
		expect(state.starItems[2]!.status).toBe('before')
		expect(state.starItems[3]!.status).toBe('after')
	})

	it('click updates value via onChange', () => {
		const onChange = vi.fn()
		const state = starsModel({ value: 1, onChange })
		const el = document.createElement('span')
		el.addEventListener('mousedown', state.starItems[2]!.onMousedown)
		el.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
		expect(onChange).toHaveBeenCalledWith(3)
	})

	it('hasZeroElement false when zeroElement not set', () => {
		expect(starsModel({ value: 3 }).hasZeroElement).toBe(false)
	})

	it('hasZeroElement true when zeroElement set', () => {
		expect(starsModel({ value: 3, zeroElement: 'star-zero' }).hasZeroElement).toBe(true)
	})

	it('range mode: inside status between min and max', () => {
		const state = starsModel({ value: [2, 4] })
		expect(state.starItems[0]!.status).toBe('before')
		expect(state.starItems[1]!.status).toBe('before')
		expect(state.starItems[2]!.status).toBe('inside')
		expect(state.starItems[3]!.status).toBe('inside')
		expect(state.starItems[4]!.status).toBe('after')
	})
})

// ── useChip ──────────────────────────────────────────────────────────────────

describe('useChip', () => {
	it('defaults tag to button', () => {
		expect(chipModel({}).tag).toBe('button')
	})

	it('isVisible starts true', () => {
		expect(chipModel({}).isVisible).toBe(true)
	})

	it('dismiss sets isVisible to false and calls onDismiss', () => {
		const onDismiss = vi.fn()
		const state = chipModel({ onDismiss })
		state.dismiss()
		expect(state.isVisible).toBe(false)
		expect(onDismiss).toHaveBeenCalled()
	})

	it('dismissLabel defaults to Remove', () => {
		expect(chipModel({}).dismissLabel).toBe('Remove')
	})
})

// ── useHeading / useText / useLink ───────────────────────────────────────────

describe('useHeading', () => {
	it('defaults level to 2', () => {
		expect(headingModel({}).level).toBe(2)
	})

	it('clamps level to 1–6', () => {
		expect(headingModel({ level: 0 as never }).level).toBe(1)
		expect(headingModel({ level: 7 as never }).level).toBe(6)
	})

	it('derives tag from level', () => {
		expect(headingModel({ level: 3 }).tag).toBe('h3')
	})

	it('respects custom tag', () => {
		expect(headingModel({ level: 1, tag: 'div' }).tag).toBe('div')
	})

	it('defaults align to start', () => {
		expect(headingModel({}).align).toBe('start')
	})
})

describe('useText', () => {
	it('defaults tag to p', () => {
		expect(textModel({}).tag).toBe('p')
	})

	it('defaults size to md', () => {
		expect(textModel({}).size).toBe('md')
	})

	it('defaults muted to false', () => {
		expect(textModel({}).muted).toBe(false)
	})
})

// ── createOverlayStack ────────────────────────────────────────────────────────

describe('createOverlayStack', () => {
	it('starts with empty stack', () => {
		expect(createOverlayStack().stack.length).toBe(0)
	})

	it('push adds entry to stack', async () => {
		const state = createOverlayStack()
		const promise = state.push({
			mode: 'modal',
			render: (close) => {
				void close
				return null
			},
		})
		expect(state.stack.length).toBe(1)
		state.stack[0]!.resolve(null)
		await promise
	})

	it('hasBackdrop true for modal mode', () => {
		const state = createOverlayStack()
		state.push({
			mode: 'modal',
			render: (close) => {
				void close
				return null
			},
		})
		expect(state.hasBackdrop).toBe(true)
	})

	it('hasBackdrop false for toast mode', () => {
		const state = createOverlayStack()
		state.push({
			mode: 'toast',
			render: (close) => {
				void close
				return null
			},
		})
		expect(state.hasBackdrop).toBe(false)
	})

	it('Escape key resolves top entry when dismissible', () => {
		const state = createOverlayStack()
		const resolve = vi.fn()
		state.stack.push({ id: 'x', mode: 'modal', render: () => null, resolve, dismissible: true })
		state.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
		expect(resolve).toHaveBeenCalledWith(null)
	})

	it('Escape key does NOT resolve when dismissible=false', () => {
		const state = createOverlayStack()
		const resolve = vi.fn()
		state.stack.push({ id: 'x', mode: 'modal', render: () => null, resolve, dismissible: false })
		state.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
		expect(resolve).not.toHaveBeenCalled()
	})
})

// ── applyTransition ───────────────────────────────────────────────────────────

describe('applyTransition', () => {
	it('calls onComplete immediately when no className', () => {
		const el = document.createElement('div')
		const cb = vi.fn()
		applyTransition(el, 'exit', { duration: 100 }, cb)
		expect(cb).toHaveBeenCalled()
	})

	it('adds exitClass to element', () => {
		const el = document.createElement('div')
		applyTransition(el, 'exit', { exitClass: 'fade-out', duration: 5000 })
		expect(el.classList.contains('fade-out')).toBe(true)
	})

	it('cleanup removes class and calls onComplete', () => {
		const el = document.createElement('div')
		const cb = vi.fn()
		const cleanup = applyTransition(el, 'exit', { exitClass: 'fade-out', duration: 5000 }, cb)
		cleanup()
		expect(el.classList.contains('fade-out')).toBe(false)
		expect(cb).toHaveBeenCalled()
	})
})

// ── bindDialog / bindToast ────────────────────────────────────────────────────

describe('bindDialog', () => {
	it('returns a callable function with confirm method', () => {
		const push = vi.fn().mockResolvedValue(null)
		const dialog = bindDialog(push)
		expect(typeof dialog).toBe('function')
		expect(typeof dialog.confirm).toBe('function')
	})

	it('calls push with modal spec', () => {
		const push = vi.fn().mockResolvedValue(null)
		const dialog = bindDialog(push)
		dialog('Hello')
		expect(push).toHaveBeenCalledWith(expect.objectContaining({ mode: 'modal' }))
	})

	it('confirm resolves true when result is ok', async () => {
		const push = vi.fn().mockResolvedValue('ok')
		const dialog = bindDialog(push)
		const result = await dialog.confirm('Are you sure?')
		expect(result).toBe(true)
	})

	it('confirm resolves false when result is not ok', async () => {
		const push = vi.fn().mockResolvedValue('cancel')
		const dialog = bindDialog(push)
		const result = await dialog.confirm('Are you sure?')
		expect(result).toBe(false)
	})
})

describe('bindToast', () => {
	it('returns a callable function with convenience methods', () => {
		const push = vi.fn().mockResolvedValue(null)
		const toast = bindToast(push)
		expect(typeof toast).toBe('function')
		expect(typeof toast.success).toBe('function')
		expect(typeof toast.error).toBe('function')
		expect(typeof toast.warn).toBe('function')
		expect(typeof toast.info).toBe('function')
	})

	it('success calls push with toast mode and success variant', () => {
		const push = vi.fn().mockResolvedValue(null)
		const toast = bindToast(push)
		toast.success('Done!')
		expect(push).toHaveBeenCalledWith(expect.objectContaining({ mode: 'toast' }))
	})
})

// ── useMenu / useMenuItem / useMenuBar ────────────────────────────────────────

describe('useMenu', () => {
	it('onSummaryClick toggles details.open', () => {
		const model = menuModel({ summary: 'Menu' })
		const details = document.createElement('details')
		const summary = document.createElement('summary')
		details.appendChild(summary)
		document.body.appendChild(details)

		details.open = false
		// Call handler directly with a synthetic event whose currentTarget is the summary
		const makeEvent = () => {
			const e = new MouseEvent('click')
			Object.defineProperty(e, 'currentTarget', { value: summary, configurable: true })
			return e
		}
		model.summary.onClick(makeEvent())
		expect(details.open).toBe(true)

		model.summary.onClick(makeEvent())
		expect(details.open).toBe(false)

		details.remove()
	})

	it('onClick closes details on internal link click', () => {
		const model = menuModel({ summary: 'Menu' })
		const details = document.createElement('details')
		details.setAttribute('open', '')
		const a = document.createElement('a')
		a.href = '/page'
		details.appendChild(a)
		document.body.appendChild(details)

		details.addEventListener('click', model.details.onClick)
		a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		expect(details.hasAttribute('open')).toBe(false)

		details.remove()
	})
})

describe('useMenuItem', () => {
	it('returns empty state', () => {
		expect(menuItemModel({ href: '/foo' })).toEqual({})
	})
})

describe('useMenuBar', () => {
	it('hasDesktopBar is always true', () => {
		expect(menuBarModel({ items: [] }).hasDesktopBar).toBe(true)
	})
})
