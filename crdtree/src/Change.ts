import {BackendAction, FrontendAction} from "./types/BaseAction";
import {ID} from "./types/Types";

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
}

export {toID};
