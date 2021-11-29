const assertSerializable = (item: unknown): void => {
	let json, copy;
	try {
		json = JSON.stringify(item);
		copy = JSON.parse(json);
	} catch (err) {
		// suppress
	}
	if ((json !== "{}" && json !== "[]" && copy !== item) || item === undefined) {
		throw new Error("Input must be JSON serializable and atomic");
	}
};

const ensureNumber = (maybeNumber: any): number => {
	if (typeof maybeNumber !== "number" || !isFinite(maybeNumber)) {
		throw new RangeError("Must use numbers to index into arrays");
	}
	return maybeNumber; // definitely number
};

declare global {
	interface Array<T> {
		partition<U>(key: (element: T) => U): Map<U, Array<T>>;
	}
}

Array.prototype.partition = function <U>(keyFn: (element) => U): Map<U, Array<any>> {
	const output = new Map();
	for (const element of this) {
		const key = keyFn(element);
		if (output.has(key)) {
			output.get(key).push(element);
		} else {
			output.set(key, [element]);
		}
	}
	return output;
};

export {assertSerializable, ensureNumber};
