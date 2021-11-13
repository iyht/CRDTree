import {ID, Index} from "./API";
import {BackendPrimitive, FrontendPrimitive} from "./Primitive";

export enum ActionKind {
	ASSIGN,
	ASSIGN_LIST,
	INSERT,
	DELETE,
	NOOP,
}

type BaseAssignment = {
	kind: ActionKind.ASSIGN;
	at: Index;
	in: ID;
};
type ListAssignment = {
	kind: ActionKind.ASSIGN_LIST,
	at: ID;
	in: ID;
};
type FrontendAssignment = (BaseAssignment | ListAssignment) & { item: FrontendPrimitive };
export type BackendAssignment = BaseAssignment & { item: BackendPrimitive };
export type BackendListAssignment = ListAssignment & { item: BackendPrimitive };
type BaseInsertion = {
	kind: ActionKind.INSERT;
	after: ID;
	in: ID;
};
type FrontendInsertion = BaseInsertion & { item: FrontendPrimitive };
export type BackendInsertion = BaseInsertion & { item: BackendPrimitive };
export type Deletion = {
	kind: ActionKind.DELETE;
	at: Index;
	in: ID;
};
export type NoOp = {
	kind: ActionKind.NOOP;
};
type Action = Deletion | NoOp;
export type FrontendAction = Action | FrontendAssignment | FrontendInsertion;
export type BackendAction = Action | BackendAssignment | BackendListAssignment | BackendInsertion;

const backendActionIsKind = (kind: ActionKind) =>
	(action: BackendAction) => action.kind === kind;

const isBackendInsertion =
	backendActionIsKind(ActionKind.INSERT) as (action: BackendAction) => action is BackendInsertion;

const isBackendAssignment =
	backendActionIsKind(ActionKind.ASSIGN) as (action: BackendAction) => action is BackendAssignment;

const isBackendListAssignment =
	backendActionIsKind(ActionKind.ASSIGN_LIST) as (action: BackendAction) => action is BackendListAssignment;

const isDeletion = backendActionIsKind(ActionKind.DELETE) as (action: BackendAction) => action is Deletion;

const isNoOp = backendActionIsKind(ActionKind.NOOP) as (action: BackendAction) => action is NoOp;

export {isBackendAssignment, isBackendListAssignment, isBackendInsertion, isDeletion, isNoOp};
