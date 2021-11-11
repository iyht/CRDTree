import {CRDTreeTransport} from "./CRDTree";

export type ID = unknown; // used for identifying forks
export type Index = number | string;
export type ROOT = "ROOT";
export type HEAD = "HEAD";
export type Primitive = string | number | boolean | null | [] | Record<string, never>;

export enum ActionKind {
	ASSIGN,
	INSERT,
	DELETE,
	NOOP,
}

type Assignment = {
	kind: ActionKind.ASSIGN;
	item: Primitive;
	at: string;
	in: ID;
};
type Insertion = {
	kind: ActionKind.INSERT;
	item: Primitive;
	after: ID | HEAD;
	in: ID;
};
type Deletion = {
	kind: ActionKind.DELETE;
	at: ID;
};
type NoOp = {
	kind: ActionKind.NOOP;
};
export type Action = Assignment | Insertion | Deletion | NoOp;
export type Change = {
	action: Action;
	pid: string;
	clock: number;
	// deps: string[];
};

export interface ICRDTree<T = any> {
	render(): T;

	serialize(): CRDTreeTransport<T>; // for when a new node joins the network
	// returns affected forks
	merge(remote: ICRDTree<T> | CRDTreeTransport<T>): ID[];

	assign<U extends Primitive = any>(indices: Index[], item: U): void;

	insert<U extends Primitive = any>(indices: [...Index[], number], item: U): void;

	delete(indices: Index[]): void;

	noop(): void; // useful when we add commit messages

	onUpdate(callback: (update: CRDTreeTransport<T>) => void): void;

	ref(): ID;

	listRefs(): ID[];

	fork(): ID;

	join(ref: ID): void; // same fork is a no-op
	checkout(ref: ID): void;
}
