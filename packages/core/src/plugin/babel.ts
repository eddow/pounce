import type { NodePath, PluginObj, types as t } from '@babel/core'
import type { JSXElement } from '@babel/types'

interface PounceBabelPluginOptions {
	types: typeof t
}

interface PounceBabelPluginState {
	opts?: Record<string, unknown>
	file?: {
		opts: {
			filename?: string
			cwd?: string
		}
	}
}

export function pounceBabelPlugin({
	types: t,
}: PounceBabelPluginOptions): PluginObj<PounceBabelPluginState> {
	const EXTENDS_HELPERS = new Set(['_extends', '__assign'])

	function isSafeExpression(node: t.Expression): boolean {
		let target = node
		// unwrapping type assertions
		while (t.isTSAsExpression(target)) {
			target = target.expression
		}

		if (t.isIdentifier(target)) return true
		if (t.isArrowFunctionExpression(target)) return true
		if (t.isFunctionExpression(target)) return true

		// Check for literals but exclude TemplateLiteral as requested
		if (t.isStringLiteral(target)) return true
		if (t.isNumericLiteral(target)) return true
		if (t.isBooleanLiteral(target)) return true
		if (t.isNullLiteral(target)) return true

		// Check for Objects
		if (t.isObjectExpression(target)) {
			return target.properties.every((prop) => {
				if (t.isObjectMethod(prop)) return true
				if (t.isSpreadElement(prop)) return false // Conservative: spread might be reactive
				if (t.isObjectProperty(prop)) {
					if (prop.computed && !isSafeExpression(prop.key as t.Expression)) return false
					return t.isExpression(prop.value) && isSafeExpression(prop.value as t.Expression)
				}
				return false
			})
		}

		// Check for Arrays
		if (t.isArrayExpression(target)) {
			return target.elements.every((elem) => {
				if (elem === null) return true // Sparse array hole
				if (t.isSpreadElement(elem)) return false
				return t.isExpression(elem) && isSafeExpression(elem as t.Expression)
			})
		}

		// Other Literals and Function-likes
		if (t.isRegExpLiteral(target)) return true
		if (t.isBigIntLiteral(target)) return true
		if (t.isClassExpression(target)) return true

		// Recursive Expressions
		// Unary: !safe, -safe, typeof safe
		if (t.isUnaryExpression(target)) {
			return isSafeExpression(target.argument)
		}

		// Binary: safe + safe, safe * safe
		if (t.isBinaryExpression(target)) {
			return (
				t.isExpression(target.left) &&
				isSafeExpression(target.left as t.Expression) &&
				t.isExpression(target.right) &&
				isSafeExpression(target.right as t.Expression)
			)
		}

		// Logical: safe && safe, safe || safe
		if (t.isLogicalExpression(target)) {
			return isSafeExpression(target.left) && isSafeExpression(target.right)
		}

		// Conditional (Ternary): safe ? safe : safe
		if (t.isConditionalExpression(target)) {
			return (
				isSafeExpression(target.test) &&
				isSafeExpression(target.consequent) &&
				isSafeExpression(target.alternate)
			)
		}

		return false
	}

	function isAttributesMergeCall(path: NodePath<t.CallExpression>) {
		const parentPath = path.parentPath
		if (!parentPath || !parentPath.isCallExpression()) return false
		const parentCallee = parentPath.node.callee
		if (t.isIdentifier(parentCallee, { name: 'h' })) {
			return parentPath.node.arguments.includes(path.node)
		}
		return false
	}

	const IMPORT_SOURCE = '@pounce/core'

	function ensureImports(path: NodePath) {
		const programPath = path.findParent((p: NodePath) =>
			p.isProgram()
		) as NodePath<t.Program> | null
		if (!programPath) return

		const ensureImport = (name: string) => {
			if (programPath.scope.hasBinding(name)) return
			const alreadyImported = programPath.node.body.some(
				(node: t.Statement) =>
					t.isImportDeclaration(node) &&
					node.source.value === IMPORT_SOURCE &&
					node.specifiers.some(
						(
							specifier: t.ImportSpecifier | t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier
						) => t.isImportSpecifier(specifier) && specifier.local.name === name
					)
			)
			if (alreadyImported) return

			const importDeclaration = programPath.node.body.find(
				(node: t.Statement): node is t.ImportDeclaration =>
					t.isImportDeclaration(node) && node.source.value === IMPORT_SOURCE
			)

			if (importDeclaration) {
				importDeclaration.specifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)))
			} else {
				programPath.unshiftContainer(
					'body',
					t.importDeclaration(
						[t.importSpecifier(t.identifier(name), t.identifier(name))],
						t.stringLiteral(IMPORT_SOURCE)
					)
				)
			}
		}

		ensureImport('h')
		ensureImport('Fragment')
		ensureImport('c')
		ensureImport('r')
	}

	function buildCompositeCall(args: t.CallExpression['arguments']) {
		const layers: t.Expression[] = []
		for (const arg of args) {
			if (t.isSpreadElement(arg)) {
				layers.push(t.cloneNode(arg.argument))
			} else if (t.isObjectExpression(arg) && arg.properties.length === 0) {
			} else if (t.isExpression(arg)) {
				layers.push(t.cloneNode(arg))
			}
		}
		return t.callExpression(t.identifier('c'), layers)
	}

	return {
		name: 'pounce-babel',
		visitor: {
			CallExpression(path: NodePath<t.CallExpression>, _state: PounceBabelPluginState) {
				if (!path.isCallExpression()) return
				const callee = path.node.callee
				let shouldTransform = false
				if (t.isIdentifier(callee) && EXTENDS_HELPERS.has(callee.name)) {
					shouldTransform = true
				} else if (
					t.isMemberExpression(callee) &&
					t.isIdentifier(callee.object, { name: 'Object' }) &&
					t.isIdentifier(callee.property, { name: 'assign' })
				) {
					shouldTransform = true
				}
				if (!shouldTransform) return
				if (!isAttributesMergeCall(path)) return
				if (!path.node.arguments.length) return
				ensureImports(path)
				path.replaceWith(buildCompositeCall(path.node.arguments))
			},
			JSXElement(path: NodePath<JSXElement>, _state: PounceBabelPluginState) {
				ensureImports(path)
				// Traverse all JSX children and attributes
				for (let index = 0; index < path.node.children.length; index++) {
					const child = path.node.children[index]
					if (t.isJSXExpressionContainer(child)) {
						const expression = child.expression
						// Check if the expression is a reactive reference (e.g., `this.counter`)
						if (!t.isJSXEmptyExpression(expression)) {
							// Rewrite `this.counter` into `() => this.counter`
							const arrowFunction = t.arrowFunctionExpression(
								[], // No args
								expression // Body is `this.counter`
							)
							path.node.children[index] = t.jsxExpressionContainer(
								t.callExpression(t.identifier('r'), [arrowFunction])
							)
						}
					}
				}

				// Also check props (e.g., `<Component prop={this.counter} />`)
				if (t.isJSXOpeningElement(path.node.openingElement)) {
					// Pass 1: support `update:attr` paired with base `attr`
					const attrs = path.node.openingElement.attributes
					for (let i = 0; i < attrs.length; i++) {
						const attr = attrs[i]
						if (t.isJSXAttribute(attr) && t.isJSXNamespacedName(attr.name)) {
							const ns = attr.name.namespace.name
							const local = attr.name.name.name
							if (ns === 'update') {
								const baseIndex = attrs.findIndex(
									(a: t.JSXAttribute | t.JSXSpreadAttribute) =>
										t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === local
								)
								if (baseIndex !== -1) {
									const baseAttr = attrs[baseIndex] as t.JSXAttribute
									// getter from base
									let getterExpr: t.Expression | null = null
									if (baseAttr.value == null) {
										getterExpr = t.booleanLiteral(true)
									} else if (
										t.isStringLiteral(baseAttr.value) ||
										t.isNumericLiteral(baseAttr.value) ||
										t.isBooleanLiteral(baseAttr.value)
									) {
										getterExpr = baseAttr.value
									} else if (t.isJSXExpressionContainer(baseAttr.value)) {
										const exp = baseAttr.value.expression
										if (!t.isJSXEmptyExpression(exp)) getterExpr = exp
									}
									// setter from update:attr
									let setterExpr: t.Expression | null = null
									if (t.isJSXExpressionContainer(attr.value)) {
										const exp = attr.value.expression
										if (
											!t.isJSXEmptyExpression(exp) &&
											(t.isArrowFunctionExpression(exp) || t.isFunctionExpression(exp))
										) {
											setterExpr = exp
										}
									}
									if (getterExpr && setterExpr) {
										const getter = t.arrowFunctionExpression([], getterExpr)
										const bindingObject = t.callExpression(t.identifier('r'), [getter, setterExpr])
										baseAttr.value = t.jsxExpressionContainer(bindingObject)
										// remove update:attr
										attrs.splice(i, 1)
										i--
									}
								}
							}
						}
					}

					// Pass 2: existing reactive transforms
					for (const attr of path.node.openingElement.attributes) {
						if (t.isJSXAttribute(attr)) {
							// Transform onEvent syntax - no transformation needed as we're using onEvent directly
							// The h() function will handle both component events and DOM events

							// Handle reactive expressions in attributes
							if (t.isJSXExpressionContainer(attr.value)) {
								const expression = attr.value.expression
								if (!t.isJSXEmptyExpression(expression)) {
									// Skip if already wrapped by r() (from update: pass)
									if (
										t.isCallExpression(expression) &&
										t.isIdentifier(expression.callee, { name: 'r' })
									) {
										continue
									}
									// Check if this is a simple property access for 2-way binding
									// Handle type assertions: `xxx as Type` or `xxx.yyy as Type`
									let innerExpression = expression
									if (t.isTSAsExpression(expression)) {
										innerExpression = expression.expression
									}
									if (t.isJSXIdentifier(attr.name) && attr.name.name === 'this') {
										// Special 'this' attribute: transform `this={expr}` to `{ set: (v) => expr = v }`
										if (!t.isLVal(innerExpression)) {
											throw path.buildCodeFrameError(
												`[jsx-reactive] The value of 'this' attribute must be an assignable expression (LVal), got ${innerExpression.type}`
											)
										}
										const setter = t.arrowFunctionExpression(
											[t.identifier('v')],
											t.assignmentExpression('=', innerExpression as t.LVal, t.identifier('v'))
										)
										const dummyGetter = t.arrowFunctionExpression([], t.identifier('undefined'))
										const bindingObject = t.callExpression(t.identifier('r'), [dummyGetter, setter])
										attr.value = t.jsxExpressionContainer(bindingObject)
									} else if (t.isMemberExpression(innerExpression)) {
										// Auto-detect 2-way binding: transform `{this.count}`, `{state.count}`, or `{state['count']}` to `{{get: () => this.count, set: (val) => this.count = val}}`
										// For type assertions, use the original expression in getter (with cast) but inner expression in setter (without cast)
										const getter = t.arrowFunctionExpression([], expression)
										const setter = t.arrowFunctionExpression(
											[t.identifier('val')],
											t.assignmentExpression('=', innerExpression, t.identifier('val'))
										)
										const bindingObject = t.callExpression(t.identifier('r'), [getter, setter])
										attr.value = t.jsxExpressionContainer(bindingObject)
									} else {
										// One-way binding
										if (!isSafeExpression(innerExpression as t.Expression)) {
											// rewrite `prop={this.counter}` into `prop={r(() => this.counter)}`
											const arrowFunction = t.arrowFunctionExpression([], expression)
											attr.value = t.jsxExpressionContainer(
												t.callExpression(t.identifier('r'), [arrowFunction])
											)
										}
									}
								}
							}
						}
					}
				}
			},
		},
	}
}
