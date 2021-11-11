import {HEAD, ID} from "./Types";
import {BackendPrimitive, FrontendPrimitive} from "./Primitive";

export enum ActionKind {
	ASSIGN,
	INSERT,
	DELETE,
	NOOP,
}

type BaseAssignment = {
	kind: ActionKind.ASSIGN;
	at: string;
	in: ID;
};
type FrontendAssignment = BaseAssignment & { item: FrontendPrimitive };
type BackendAssignment = BaseAssignment & { item: BackendPrimitive };
type BaseInsertion = {
	kind: ActionKind.INSERT;
	after: ID | HEAD;
	in: ID;
};
type FrontendInsertion = BaseInsertion & { item: FrontendPrimitive };
type BackendInsertion = BaseInsertion & { item: BackendPrimitive };
type Deletion = {
	kind: ActionKind.DELETE;
	at: ID;
};
type NoOp = {
	kind: ActionKind.NOOP;
};
type BaseAction = Deletion | NoOp;
export type FrontendAction = BaseAction | FrontendAssignment | FrontendInsertion;
export type BackendAction = BaseAction | BackendAssignment | BackendInsertion;

const backendActionIsKind = (kind: ActionKind) =>
	(action: BackendAction) => action.kind === kind;

const isBackendInsertion =
	backendActionIsKind(ActionKind.INSERT) as (action: BackendAction) => action is BackendInsertion;

const isBackendAssignment =
	backendActionIsKind(ActionKind.ASSIGN) as (action: BackendAction) => action is BackendAssignment;

const isDeletion = backendActionIsKind(ActionKind.DELETE) as (action: BackendAction) => action is Deletion;

const isNoOp = backendActionIsKind(ActionKind.NOOP) as (action: BackendAction) => action is NoOp;

export {isBackendAssignment, isBackendInsertion, isDeletion, isNoOp};
