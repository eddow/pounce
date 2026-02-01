type Prettify<T> = {
	[K in keyof T]: T[K]
} & {};

type _Extract<T extends string> =
	T extends `http${string}` ? {} :
	T extends `${string}[${infer Param}]${infer Rest}`
	? { [K in Param]: string } & _Extract<Rest>
	: {};

export type ExtractPathParams<T extends string> = Prettify<_Extract<T>>;
