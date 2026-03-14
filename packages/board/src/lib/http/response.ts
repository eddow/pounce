/**
 * Enhanced Response wrapper for sursaut-board
 * Allows multiple reads of the body and tracks internal state
 */

export class SursautResponse extends Response {
	private _bufferCache: string | null = null

	// Override json to cache the parsed value
	override async json(): Promise<any> {
		const text = await this.text()
		if (!text) {
			return null
		}
		return JSON.parse(text)
	}

	// Override text to cache the raw text
	override async text(): Promise<string> {
		if (this._bufferCache !== null) {
			return this._bufferCache
		}

		const text = await super.text()
		this._bufferCache = text
		return text
	}

	// Method to update the cached response body
	setData(data: unknown): void {
		this._bufferCache = JSON.stringify(data)
	}

	override clone(): SursautResponse {
		const cloned = new SursautResponse(this._bufferCache || this.body, {
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
		})
		cloned._bufferCache = this._bufferCache
		return cloned
	}

	static from(response: Response): SursautResponse {
		if (response instanceof SursautResponse) return response

		// Handle the case where the body might have already been consumed
		let body: BodyInit | null = null
		if (response.body) {
			// If the response body hasn't been consumed, we can clone it
			try {
				body = response.clone().body
			} catch (_e) {
				// Body was already consumed, create an empty response
				body = null
			}
		}

		const res = new SursautResponse(body, response)
		// If we couldn't get the body, mark it as already consumed
		if (body === null) {
			res._bufferCache = ''
		}
		return res
	}
}
