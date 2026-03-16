import { expose } from '@sursaut/board'

export default expose<{ id: string }>({
	stream: async function* (req) {
		for (let i = 0; i < 5; i++) {
			yield { id: i, text: `Comment ${i} on post ${req.params.id}`, ts: Date.now() }
			await new Promise((r) => setTimeout(r, 1000))
		}
	},
})
