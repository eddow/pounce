import { expect, type Page } from '@playwright/test'

export const openMenu = async (page: Page) => {
	// Desktop layout exposes menu items directly; mobile layout uses a burger button.
	const burger = page.getByRole('button', { name: 'Open navigation' })
	if (await burger.isVisible()) {
		await burger.click()
	}
}

type OpenSectionArgs = {
	readonly menuName: 'Display' | 'Forms' | 'Interaction' | 'Dockview' | 'Toolbar' | 'Infinite Scroll'
	readonly expectedUrlPath: '/display' | '/forms' | '/interaction' | '/dockview' | '/toolbar' | '/infinite-scroll'
	readonly expectedHeading: string
	readonly headingLevel: 1 | 2
}

export const openSection = async (page: Page, args: OpenSectionArgs) => {
	await page.goto(args.expectedUrlPath)
	await expect(page.getByRole('heading', { level: args.headingLevel, name: args.expectedHeading })).toBeVisible()
}
