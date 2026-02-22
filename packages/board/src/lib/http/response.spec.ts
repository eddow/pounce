import { describe, expect, it } from 'vitest'
import { PounceResponse } from './response.js'

describe('PounceResponse', () => {
	it('should allow reading body multiple times as JSON', async () => {
		const data = { hello: 'world' }
		const res = new PounceResponse(JSON.stringify(data))

		const first = await res.json()
		const second = await res.json()

		expect(first).toEqual(data)
		expect(second).toEqual(data)
	})

	it('should allow reading body multiple times as text', async () => {
		const jsonString = '{"test": "data"}'
		const res = new PounceResponse(jsonString)

		const first = await res.text()
		const second = await res.text()

		expect(first).toBe(jsonString)
		expect(second).toBe(jsonString)
	})

	it('should handle null body', async () => {
		const res = new PounceResponse(null)

		const text = await res.text()
		expect(text).toBe('')

		const json = await res.json()
		expect(json).toBeNull()
	})

	it('should handle empty body', async () => {
		const res = new PounceResponse('')

		const text = await res.text()
		expect(text).toBe('')

		const json = await res.json()
		expect(json).toBeNull()
	})

	it('should clone with cached buffer', async () => {
		const data = { cloned: true }
		const res = new PounceResponse(JSON.stringify(data))

		// Read original to cache the buffer
		await res.text()

		const cloned = res.clone()
		expect(cloned).toBeInstanceOf(PounceResponse)

		// Both should have the same cached data
		const originalText = await res.text()
		const clonedText = await cloned.text()
		expect(originalText).toBe(clonedText)
	})

	it('should throw if body is read from standard Response then converted to PounceResponse', async () => {
		const standardRes = new Response('{"test": "data"}')

		// Consume the body of the standard response
		await standardRes.text()

		// Converting after consumption should result in empty cached response
		const pounceRes = PounceResponse.from(standardRes)
		expect(pounceRes).toBeInstanceOf(PounceResponse)

		const text = await pounceRes.text()
		expect(text).toBe('')
	})
})
