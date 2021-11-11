import {CRDTreeTransport} from "../CRDTree";

export type ID = `${string}@${number}` | HEAD | ROOT_PARENT;
export type Index = number | string;
export type ROOT = "ROOT";
export type ROOT_PARENT = "PARENT";
export type HEAD = "HEAD";
export enum ObjectKind {
	ARRAY,
	OBJECT,
}
export type TruePrimitive = string | number | boolean | null;
export type FrontendPrimitive = TruePrimitive | [] | Record<string, never>;
export type BackendPrimitive = TruePrimitive | {kind: ObjectKind, name: ID};

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
type FrontendAssignment = Assignment & {item: FrontendPrimitive};
type BackendAssignment = Assignment & {item: BackendPrimitive};
type Insertion = {
	kind: ActionKind.INSERT;
	after: ID | HEAD;
	in: ID;
};
type FrontendInsertion = Insertion & {item: FrontendPrimitive};
type BackendInsertion = Insertion & {item: BackendPrimitive};
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
export type FrontendChange = ChangeBase & {action: FrontendAction};
export type BackendChange = ChangeBase & {action: BackendAction};

export type Change = FrontendChange | BackendChange;

export interface ICRDTree<T = any> {
	render(): T;

	serialize(): CRDTreeTransport<T>; // for when a new node joins the network
	// returns affected forks
	merge(remote: ICRDTree<T> | CRDTreeTransport<T>): ID[];

	assign<U extends FrontendPrimitive = any>(indices: Index[], item: U): void;

	insert<U extends FrontendPrimitive = any>(indices: [...Index[], number], item: U): void;

	delete(indices: Index[]): void;

	noop(): void; // useful when we add commit messages

	onUpdate(callback: (update: CRDTreeTransport<T>) => void): void;

	ref(): ID;

	listRefs(): ID[];

	fork(): ID;

	join(ref: ID): void; // same fork is a no-op
	checkout(ref: ID): void;
}
