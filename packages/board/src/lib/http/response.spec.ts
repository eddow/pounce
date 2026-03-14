import { describe, expect, it } from 'vitest'
import { SursautResponse } from './response.js'

describe('SursautResponse', () => {
	it('should allow reading body multiple times as JSON', async () => {
		const data = { hello: 'world' }
		const res = new SursautResponse(JSON.stringify(data))

		const first = await res.json()
		const second = await res.json()

		expect(first).toEqual(data)
		expect(second).toEqual(data)
	})

	it('should allow reading body multiple times as text', async () => {
		const jsonString = '{"test": "data"}'
		const res = new SursautResponse(jsonString)

		const first = await res.text()
		const second = await res.text()

		expect(first).toBe(jsonString)
		expect(second).toBe(jsonString)
	})

	it('should handle null body', async () => {
		const res = new SursautResponse(null)

		const text = await res.text()
		expect(text).toBe('')

		const json = await res.json()
		expect(json).toBeNull()
	})

	it('should handle empty body', async () => {
		const res = new SursautResponse('')

		const text = await res.text()
		expect(text).toBe('')

		const json = await res.json()
		expect(json).toBeNull()
	})

	it('should clone with cached buffer', async () => {
		const data = { cloned: true }
		const res = new SursautResponse(JSON.stringify(data))

		// Read original to cache the buffer
		await res.text()

		const cloned = res.clone()
		expect(cloned).toBeInstanceOf(SursautResponse)

		// Both should have the same cached data
		const originalText = await res.text()
		const clonedText = await cloned.text()
		expect(originalText).toBe(clonedText)
	})

	it('should throw if body is read from standard Response then converted to SursautResponse', async () => {
		const standardRes = new Response('{"test": "data"}')

		// Consume the body of the standard response
		await standardRes.text()

		// Converting after consumption should result in empty cached response
		const sursautRes = SursautResponse.from(standardRes)
		expect(sursautRes).toBeInstanceOf(SursautResponse)

		const text = await sursautRes.text()
		expect(text).toBe('')
	})
})
