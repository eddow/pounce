import { compose } from '@pounce/core'
import { Button } from '../components/button'
import { InfiniteScroll } from '../components/infinite-scroll'
import { Inline, Stack } from '../components/layout'
import { Heading } from '../components/typography'

const InfiniteScrollDemo = () => {
	const state = compose({
		items: Array.from({ length: 50 }, (_, i) => `Item ${i}`),
		stickyLast: true,
		autoAdd: false,
		intervalId: 0,
	})

	const addItem = () => {
		state.items = [...state.items, `Item ${state.items.length}`]
	}

	return (
		<Stack gap="1rem" style="height: 100%;">
			<Heading level={2}>Infinite Scroll</Heading>

			<Inline gap="1rem" align="center">
				<Button onClick={addItem} variant="primary">
					Add Item
				</Button>
				<span>Count: {state.items.length}</span>
				<label>
					<input
						type="checkbox"
						checked={state.stickyLast}
						onInput={(e) => (state.stickyLast = (e.target as HTMLInputElement).checked)}
					/>
					Sticky Bottom
				</label>
			</Inline>

			<div style="height: 400px; border: 1px solid var(--pico-muted-border-color); border-radius: 4px;">
				<InfiniteScroll
					items={state.items}
					itemHeight={30}
					stickyLast={state.stickyLast}
					el={{ style: 'height: 100%;' }}
				>
					{(item, index) => (
						<div style="padding: 0 1rem; line-height: 30px; border-bottom: 1px solid #eee;">
							<strong>{index}:</strong> {item}
						</div>
					)}
				</InfiniteScroll>
			</div>
		</Stack>
	)
}

export default InfiniteScrollDemo
