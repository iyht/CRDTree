import {ROOT, ROOT_PARENT} from "./Constants";
import {ID, Index} from "./API";
import {Entry, MetaMap} from "./StateObject";
import {ObjectKind} from "./Primitive";

const render = <T>(objects: MetaMap): T => {
	const metaObject = objects.get(ROOT_PARENT) as Map<Index, Entry>;
	if (metaObject.get(ROOT).deleted) {
		return undefined;
	} else {
		return renderRecursiveMap(metaObject, objects)[ROOT];
	}
};

const renderRecursiveMap = (metaObject: Map<Index, Entry>, objects: MetaMap): any => {
	return Array.from(metaObject.entries()).reduce((element: any, [index, entry]): any => {
		if (entry.deleted === false) {
			element[index] = renderRecursive(entry, objects);
		}
		return element;
	}, {});
};

const renderRecursiveList = (metaObject: Array<Entry>, objects: MetaMap): any => {
	return metaObject.filter((entry) => entry.deleted === false)
		.map((entry) => renderRecursive(entry, objects));
};

const renderRecursive = (entry: Entry, objects: MetaMap): any => {
	const {value, kind} = entry;
	if (kind !== ObjectKind.OTHER) {
		const metaObject = objects.get(value as ID);
		return Array.isArray(metaObject) ?
			renderRecursiveList(metaObject, objects) : renderRecursiveMap(metaObject, objects);
	} else {
		return value;
	}
};

export {render};
