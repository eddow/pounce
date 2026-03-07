import { expect, test as base } from '@playwright/test'

const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		const prefix = `[BROWSER ${testInfo.titlePath.slice(1).join(' > ')}]`

		page.on('console', (message) => {
			const location = message.location()
			const suffix = location.url
				? ` (${location.url}:${location.lineNumber}:${location.columnNumber})`
				: ''
			const line = `${prefix} [${message.type()}] ${message.text()}${suffix}`
			if (message.type() === 'error' || message.type() === 'warning') console.error(line)
			else console.log(line)
		})

		page.on('pageerror', (error) => {
			console.error(`${prefix} [pageerror] ${error.message}`)
		})

		page.on('requestfailed', (request) => {
			const failure = request.failure()
			console.error(
				`${prefix} [requestfailed] ${request.method()} ${request.url()} ${failure?.errorText ?? 'unknown error'}`
			)
		})

		await use(page)
	},
})

export { expect, test }
export type { Page } from '@playwright/test'
