export function hasNumberField<Obj extends object & {}, K extends PropertyKey>(
	obj: Obj,
	key: K,
): obj is Obj & Record<K, number> {
	// @ts-expect-error: cannot narrow variable to have key K
	return typeof obj[key] == 'number';
}

export function hasStringField<Obj extends object & {}, K extends PropertyKey>(
	obj: Obj,
	key: K,
): obj is Obj & Record<K, string> {
	// @ts-expect-error: cannot narrow variable to have key K
	return typeof obj[key] == 'string';
}

export function hasObjectField<Obj extends object & {}, K extends PropertyKey>(
	obj: Obj,
	key: K,
): obj is Obj & Record<K, object> {
	// @ts-expect-error: cannot narrow variable to have key K
	return typeof obj[key] == 'object';
}

export function hasBooleanField<Obj extends object & {}, K extends PropertyKey>(
	obj: Obj,
	key: K,
): obj is Obj & Record<K, boolean> {
	// @ts-expect-error: cannot narrow variable to have key K
	return typeof obj[key] == 'boolean';
}

export function hasArrayField<Obj extends object & {}, K extends PropertyKey>(
	obj: Obj,
	key: K,
): obj is Obj & Record<K, unknown[]> {
	// @ts-expect-error: cannot narrow variable to have key K
	return Array.isArray(obj[key]);
}
