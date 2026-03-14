import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Plugin } from 'vite'

const RESOLVABLE_EXTENSIONS = [
	'.ts',
	'.tsx',
	'.js',
	'.jsx',
	'.mjs',
	'.cjs',
	'.mts',
	'.cts',
	'.json',
]

export interface PlusImportResolverOptions {
	routesDir: string
	projectRoot?: string
}

function stripQueryAndHash(filePath: string): string {
	const queryIndex = filePath.indexOf('?')
	const hashIndex = filePath.indexOf('#')
	const cutoff = [queryIndex, hashIndex]
		.filter((i) => i >= 0)
		.reduce((min, i) => Math.min(min, i), Infinity)
	return cutoff === Infinity ? filePath : filePath.slice(0, cutoff)
}

function isInside(rootDir: string, targetPath: string): boolean {
	const relative = path.relative(rootDir, targetPath)
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function findResolvableFile(candidateBase: string): string | null {
	if (fs.existsSync(candidateBase) && fs.statSync(candidateBase).isFile()) {
		return candidateBase
	}

	const hasExtension = path.extname(candidateBase) !== ''
	if (!hasExtension) {
		for (const extension of RESOLVABLE_EXTENSIONS) {
			const withExtension = `${candidateBase}${extension}`
			if (fs.existsSync(withExtension) && fs.statSync(withExtension).isFile()) {
				return withExtension
			}
		}
	}

	if (fs.existsSync(candidateBase) && fs.statSync(candidateBase).isDirectory()) {
		for (const extension of RESOLVABLE_EXTENSIONS) {
			const indexPath = path.join(candidateBase, `index${extension}`)
			if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
				return indexPath
			}
		}
	}

	return null
}

export function resolvePlusImport(
	source: string,
	importer: string | undefined,
	options: PlusImportResolverOptions
): string | null {
	if (!source.startsWith('+') || source.length === 1) return null
	if (!importer) return null

	const normalizedImporter = path.resolve(stripQueryAndHash(importer))
	const importerDir = path.dirname(normalizedImporter)
	const routesRoot = path.resolve(options.projectRoot ?? process.cwd(), options.routesDir)

	if (!isInside(routesRoot, importerDir)) return null

	const slashIndex = source.indexOf('/')
	const bucket = slashIndex === -1 ? source : source.slice(0, slashIndex)
	const targetPath = slashIndex === -1 ? '' : source.slice(slashIndex + 1)

	if (!bucket.startsWith('+') || bucket.length === 1) return null

	let currentDir = importerDir
	while (true) {
		const bucketPath = path.join(currentDir, bucket)
		const candidateBase = targetPath === '' ? bucketPath : path.join(bucketPath, targetPath)
		const resolved = findResolvableFile(candidateBase)
		if (resolved) return resolved

		if (currentDir === routesRoot) break
		const parentDir = path.dirname(currentDir)
		if (parentDir === currentDir || !isInside(routesRoot, parentDir)) break
		currentDir = parentDir
	}

	return null
}

export function plusImportResolverPlugin(options: PlusImportResolverOptions): Plugin {
	return {
		name: 'sursaut-board-plus-import-resolver',
		enforce: 'pre',
		resolveId(source, importer) {
			return resolvePlusImport(source, importer, options)
		},
	}
}
