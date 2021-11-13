import {Entry} from "./StateObject";
import {ID} from "./API";
import {ObjectPrimitive} from "./Primitive";
import {BackendInsertion} from "./Action";
import {nameLt} from "./Clock";

const assignToList = (parent: Array<Entry>, at: ID, item: ObjectPrimitive): void => {
	const trueIndex = parent.findIndex((entry) => entry.name === at);
	if (trueIndex < 0) {
		// TODO this should get checked before application
		throw new RangeError("Cannot assign to something that does not exist");
	}
	const oldEntry = parent[trueIndex];
	parent[trueIndex] = {...oldEntry, value: item.value, kind: item.kind, deleted: false};
};

const insertInList = (parent: Array<Entry>, index: number, item: ObjectPrimitive): void => {
	const {name, value, kind} = item;
	parent.splice(index, 0, {name, value, kind, deleted: false});
};

const findIndexInTombstoneArray = (entries: Array<Entry>, liveIndex: number): number => {
	let currentIndexOffset = liveIndex;
	let index;
	for (index = 0; index < entries.length; index = index + 1) {
		const entry = entries[index];
		if (entry.deleted === false) {
			if (currentIndexOffset === 0) {
				return index;
			} else {
				currentIndexOffset = currentIndexOffset - 1;
			}
		}
	}
	if (liveIndex < 0) {
		return -1;
	} else {
		throw new RangeError("Attempting to insert off the end of the list");
	}
};

const findInsertionIndex = (entries: Array<Entry>, insertion: BackendInsertion): number => {
	const {after} = insertion;
	// if inserting at the beginning of the list, start will be -1
	const start = entries.findIndex((entry) => entry.name === after);
	for (let index = start + 1; index < entries.length; index = index + 1) {
		const existingEntry = entries[index];
		if (nameLt(existingEntry.name, insertion.item.name)) { // existing entry happened before
			return index;
		}
	}
	return entries.length;
};

export {insertInList, assignToList, findIndexInTombstoneArray, findInsertionIndex};
