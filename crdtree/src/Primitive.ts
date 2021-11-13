import {ID} from "./API";

export enum ObjectKind {
	ARRAY,
	OBJECT,
	OTHER,
}
export type ObjectPrimitive = { kind: ObjectKind, value: BasePrimitive, name: ID };
export type BasePrimitive = string | number | boolean | null | undefined;
export type FrontendPrimitive = BasePrimitive | [] | Record<string, never>;
export type BackendPrimitive = ObjectPrimitive;

const isBasePrimitive = (unknown: unknown): unknown is BasePrimitive => {
	if (unknown === null || unknown === undefined) {
		return true;
	} else {
		const type = typeof unknown;
		return ["boolean", "string", "number"].includes(type);
	}
};

const isBackendPrimitive = (unknown: unknown): unknown is BackendPrimitive => {
	return typeof unknown === "object" && unknown !== null &&
		Object.values(ObjectKind).includes(unknown["kind"]) &&
		typeof unknown["name"] === "string";
};

const toObjectPrimitive = (name: ID, item: FrontendPrimitive): ObjectPrimitive => {
	if (typeof item === "object" && item !== null) {
		return {name, value: name, kind: Array.isArray(item) ? ObjectKind.ARRAY : ObjectKind.OBJECT};
	} else {
		return {name, value: item as BasePrimitive, kind: ObjectKind.OTHER};
	}
};

export {isBasePrimitive, isBackendPrimitive, toObjectPrimitive};
