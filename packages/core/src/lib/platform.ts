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
 * Returns a function that throws ImplementationError when called.
 */
export function implementationDependent(feature: string): any {
	return (..._args: any[]) => {
		throw new ImplementationError(feature)
	}
}
