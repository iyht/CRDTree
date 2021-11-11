import {HEAD, ID} from "./Types";

export enum ObjectKind {
	ARRAY,
	OBJECT,
}

export type TruePrimitive = string | number | boolean | null;
export type FrontendPrimitive = TruePrimitive | [] | Record<string, never>;
export type BackendPrimitive = TruePrimitive | { kind: ObjectKind, name: ID };

export enum ActionKind {
	ASSIGN,
	INSERT,
	DELETE,
	NOOP,
}

type Assignment = {
	kind: ActionKind.ASSIGN;
	at: string;
	in: ID;
};
type FrontendAssignment = Assignment & { item: FrontendPrimitive };
type BackendAssignment = Assignment & { item: BackendPrimitive };
type Insertion = {
	kind: ActionKind.INSERT;
	after: ID | HEAD;
	in: ID;
};
type FrontendInsertion = Insertion & { item: FrontendPrimitive };
type BackendInsertion = Insertion & { item: BackendPrimitive };
type Deletion = {
	kind: ActionKind.DELETE;
	at: ID;
};
type NoOp = {
	kind: ActionKind.NOOP;
};
export type Action = Deletion | NoOp;
export type FrontendAction = Action | FrontendAssignment | FrontendInsertion;
export type BackendAction = Action | BackendAssignment | BackendInsertion;
type ChangeBase = {
	pid: string;
	clock: number;
	// deps: string[];
};
export type FrontendChange = ChangeBase & { action: FrontendAction };
export type BackendChange = ChangeBase & { action: BackendAction };
export type Change = FrontendChange | BackendChange;
