import { ExtractPathParams } from '../types/inference';

export type ApiParams<Path extends string> = ExtractPathParams<Path>;

// Helper to check if a type is empty (has no keys)
type IsEmpty<T> = keyof T extends never ? true : false;

export function api<Path extends string>(path: Path) {
	return {
		get: (
			...args: IsEmpty<ApiParams<Path>> extends true
				? []
				: [params: ApiParams<Path>]
		) => {
			const [params] = args;
			// Implementation would interpolate params into path here
			// For now, this is just the type structure as requested
			return Promise.resolve({ path, params });
		},
		post: (
			data: any,
			...args: IsEmpty<ApiParams<Path>> extends true
				? []
				: [params: ApiParams<Path>]
		) => {
			const [params] = args;
			return Promise.resolve({ path, params, data });
		}
	};
}
