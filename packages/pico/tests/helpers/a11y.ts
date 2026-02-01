import { expect, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

export async function runA11yCheck(page: Page) {
	// small settle to reduce flaky findings
	await page.waitForTimeout(50)
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
	const seriousOrWorse = (results.violations ?? []).filter((v) =>
		['serious', 'critical'].includes(v.impact as string)
	)
	const message = seriousOrWorse
		.map(
			(v) =>
				`${v.id}: ${v.help} (${v.impact})\n` +
				v.nodes.map((n) => `  - ${n.html}\n    ${n.failureSummary ?? ''}`.trim()).join('\n')
		)
		.join('\n\n')
	// soft to keep suite flowing while reporting
	expect.soft(seriousOrWorse, message).toHaveLength(0)
	return results
}
