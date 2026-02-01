import { defineRoute } from '@pounce/board'
import { type } from 'arktype'

export const userRoute = defineRoute('/users/[id]', type({
	'details?': 'boolean',
	'format?': "'full' | 'compact'",
}))
