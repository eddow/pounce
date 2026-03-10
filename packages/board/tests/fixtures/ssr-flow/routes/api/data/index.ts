import { expose } from 'pounce-board/server'

export default expose({
	get: async () => {
		return {
			status: 200,
			data: { message: 'Hello from SSR!', timestamp: Date.now() },
		}
	},
})
