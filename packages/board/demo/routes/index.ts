import { expose } from '@sursaut/board'

export default expose({
	provide: async (_req) => ({
		siteName: 'Sursaut Demo',
		buildTime: new Date().toISOString(),
	}),
})
