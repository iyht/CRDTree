import {ActionKind, BackendAction, FrontendAction} from "./types/BaseAction";
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

export {toID, ensureBackendChange};
