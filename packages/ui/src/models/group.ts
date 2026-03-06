export type GroupCollection<Value> = Set<Value> | Value[]

export type GroupBinding<Value> = Value | GroupCollection<Value> | null | undefined

export function hasGroupValue<Value>(group: GroupBinding<Value>, value: Value): boolean {
	if (group instanceof Set) return group.has(value)
	if (Array.isArray(group)) return group.includes(value)
	return group === value
}

export function toggleGroupCollectionValue<Value>(
	group: GroupCollection<Value>,
	value: Value,
	next: boolean
): void {
	if (group instanceof Set) {
		if (next) group.add(value)
		else group.delete(value)
		return
	}

	const index = group.indexOf(value)
	if (next && index === -1) group.push(value)
	if (!next && index !== -1) group.splice(index, 1)
}

export function setGroupValue<Value>(
	group: GroupBinding<Value>,
	value: Value,
	next: boolean
): GroupBinding<Value> {
	if (group instanceof Set || Array.isArray(group)) {
		toggleGroupCollectionValue(group, value, next)
		return group
	}
	if (next) return value
	return group === value ? null : group
}
