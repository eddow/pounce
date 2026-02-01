/**
 * Error thrown when a platform-specific feature is accessed but not implemented
 * in the current environment.
 */
export class ImplementationError extends Error {
	constructor(featureInfo?: string) {
		super(
			featureInfo
				? `Not Implemented: ${featureInfo} is implementation-dependent and not available.`
				: 'Not Implemented: This feature is implementation-dependent.'
		)
		this.name = 'ImplementationError'
	}
}

/**
 * Placeholder for functions that are implementation-dependent.
 * Throws ImplementationError when called.
 * Type is generic (...args: any[]) => any to allow assignment to any function signature.
 */
export function implementationDependent(..._args: any[]): any {
	throw new ImplementationError()
}
