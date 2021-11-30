import {ActionKind, BackendAction, FrontendAction} from "./Action";
import {ID} from "./API";
import {isBackendPrimitive, toObjectPrimitive} from "./Primitive";

type ChangeBase = {
	pid: string;
	clock: number;
	dep: ID | undefined;
	branch: string;
};
export type FrontendChange = ChangeBase & { action: FrontendAction };
export type BackendChange = ChangeBase & { action: BackendAction };
export type Change = FrontendChange | BackendChange;

const toID = (change: Change): ID => {
	const {pid, clock, branch} = change;
	return `${pid}@${branch}@${clock}` as ID;
};

const ensureBackendChange = (change: Change): BackendChange => {
	const {kind} = change.action;
	if (kind === ActionKind.DELETE || kind === ActionKind.NOOP ||
		kind === ActionKind.FORK || kind === ActionKind.JOIN ||
		isBackendPrimitive(change.action.item)) {
		return change as BackendChange;
	} else {
		const name: ID = toID(change);
		const item = toObjectPrimitive(name, change.action.item);
		const action = {...change.action, item};
		return {...change, action};
	}
};

const changeLt = (a: Change, b: Change): boolean => {
	if (a.clock < b.clock) return true;
	if (b.clock < a.clock) return false;
	if (a.action.kind === ActionKind.FORK && b.action.kind !== ActionKind.FORK) return true;
	if (b.action.kind === ActionKind.FORK && a.action.kind !== ActionKind.FORK) return false;
	if (a.action.kind === ActionKind.DELETE && b.action.kind !== ActionKind.DELETE) return true;
	if (b.action.kind === ActionKind.DELETE && a.action.kind !== ActionKind.DELETE) return false;
	if (a.pid < b.pid) return true;
	if (b.pid < a.pid) return false;
	if (a.branch < b.branch) return true;
	if (b.branch < a.branch) return false;
	throw new EvalError("Two items in list with same name should be impossible");
};

const changeSortCompare = (a: Change, b: Change): number => {
	if (changeLt(a, b)) {
		return -1;
	} else {
		return 1;
	}
};

export {toID, ensureBackendChange, changeLt, changeSortCompare};
