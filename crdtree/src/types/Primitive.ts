import {ID} from "./Types";

export enum ObjectKind {
	ARRAY,
	OBJECT,
}
export type BasePrimitive = string | number | boolean | null;
export type FrontendPrimitive = BasePrimitive | [] | Record<string, never>;
export type BackendPrimitive = BasePrimitive | { kind: ObjectKind, name: ID };
