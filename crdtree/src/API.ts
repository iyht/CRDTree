import {FrontendPrimitive} from "./Primitive";
import {HEAD, ROOT, ROOT_PARENT} from "./Constants";
import {BackendChange} from "./Change";

export type ID = `${string}@${string}@${number}` | HEAD | ROOT | ROOT_PARENT;
export type Index = number | string;
export type CRDTreeTransport<T> = BackendChange[]; // used for sending updates across the network

export interface ICRDTree<T = any> {
	render: T;
	ref: string;

	serialize(): CRDTreeTransport<T>; // for when a new node joins the network
	// returns affected forks
	merge(remote: ICRDTree<T> | CRDTreeTransport<T>): string[];

	assign<U extends FrontendPrimitive = any>(indices: Index[], item: U): void;

	insert<U extends FrontendPrimitive = any>(indices: [...Index[], number], item: U): void;

	delete(indices: Index[]): void;

	noop(): void; // useful when we add commit messages

	onUpdate(callback: (branchesAffected: Set<string>, update: CRDTreeTransport<T>) => void): void;

	listRefs(): string[];

	fork(name?: string): string;

	join(ref: string): void; // same fork is a no-op
	checkout(ref: string): void;
}
