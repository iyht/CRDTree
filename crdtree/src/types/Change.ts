import {BackendAction, FrontendAction} from "./BaseAction";

type ChangeBase = {
	pid: string;
	clock: number;
	// deps: string[];
};
export type FrontendChange = ChangeBase & { action: FrontendAction };
export type BackendChange = ChangeBase & { action: BackendAction };
export type Change = FrontendChange | BackendChange;
