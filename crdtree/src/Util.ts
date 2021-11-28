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

export {assertSerializable, ensureNumber};
