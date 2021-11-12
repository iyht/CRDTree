import {ID} from "./Types";

export enum ObjectKind {
	ARRAY,
	OBJECT,
}
export type ObjectPrimitive = { kind: ObjectKind, name: ID };
export type BasePrimitive = string | number | boolean | null | undefined;
export type FrontendPrimitive = BasePrimitive | [] | Record<string, never>;
export type BackendPrimitive = BasePrimitive | ObjectPrimitive;

const isBasePrimitive = (unknown: unknown): unknown is BasePrimitive => {
	if (unknown === null || unknown === undefined) {
		return true;
	} else {
		const type = typeof unknown;
		return ["boolean", "string", "number"].includes(type);
	}
};

const isBackendPrimitive = (unknown: unknown): unknown is BackendPrimitive => {
	if (isBasePrimitive(unknown)) {
		return true;
	} else {
		return typeof unknown === "object" &&
			Object.values(ObjectKind).includes(unknown["kind"]) &&
			typeof unknown["name"] === "string";
	}
};

export {isBasePrimitive, isBackendPrimitive};
