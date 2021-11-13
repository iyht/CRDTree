import {ActionKind, BackendAction, FrontendAction} from "./Action";
import {ID} from "./API";
import {isBackendPrimitive, toObjectPrimitive} from "./Primitive";

type ChangeBase = {
	pid: string;
	clock: number;
};
export type FrontendChange = ChangeBase & { action: FrontendAction };
export type BackendChange = ChangeBase & { action: BackendAction };
export type Change = FrontendChange | BackendChange;

const toID = (change: Change): ID => {
	const {pid, clock} = change;
	return `${pid}@${clock}` as ID;
};

const ensureBackendChange = (change: Change): BackendChange => {
	const {kind} = change.action;
	if (kind === ActionKind.DELETE || kind === ActionKind.NOOP || isBackendPrimitive(change.action.item)) {
		return change as BackendChange;
	} else {
		const {pid, clock} = change;
		const name: ID = `${pid}@${clock}`;
		const item = toObjectPrimitive(name, change.action.item);
		const action = {...change.action, item};
		return {...change, action};
	}
};

const changeLt = (a: Change, b: Change): boolean => {
	if (a.clock < b.clock) return true;
	if (b.clock < a.clock) return false;
	if (a.action.kind === ActionKind.DELETE && b.action.kind !== ActionKind.DELETE) return true;
	if (b.action.kind === ActionKind.DELETE && a.action.kind !== ActionKind.DELETE) return false;
	if (a.pid < b.pid) return true;
	if (b.pid < a.pid) return false;
	throw new EvalError("Two items in list with same name should be impossible");
};

export {toID, ensureBackendChange, changeLt};
