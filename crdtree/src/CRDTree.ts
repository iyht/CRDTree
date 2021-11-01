export type CRDTreeTransport<T> = Operation[]; // used for sending updates across the network
type ID = unknown; // used for identifying forks
type Index = number | string;


export class Operation {
	clock: number;
	branch: string;
	op: string;
	data: string;
	index: string;
}

export interface ICRDTree<T = any> {
	// new (intialState: T): CRDTree<T>;
	// new (from: CRDTreeTransport<T>): CRDTree<T>;

	render(): T;

	serialize(): CRDTreeTransport<T>; // for when a new node joins the network
	// returns affected forks, throws DifferentForkException
	merge(remote: CRDTree<T> | CRDTreeTransport<T>): ID[];

	assign<U = any>(indices: Index[], item: U): void;
	insert<U = any>(indices: [...Index[], number], item: U): void;
	delete(indices: Index[]): void;

	onUpdate(callback: (update: CRDTreeTransport<T>) => void);

	ref(): ID;
	listRefs(): ID[];
	fork(): ID;
	join(ref: ID): void; // throws UnrelatedHistoryException (same fork is a no-op)
	checkout(ref: ID): void;
}

export class CRDTree<T = any> implements ICRDTree<T> {
	assign<U = any>(indices: Index[], item: U): void {
		return;
	}

	checkout(ref: ID): void {
		return;
	}

	serialize(): CRDTreeTransport<T> {
		return undefined;
	}

	delete(indices: Index[]): void {
		return;
	}

	fork(): ID {
		return undefined;
	}

	insert<U = any>(indices: [...Index[], number], item: U): void {
	}

	join(ref: ID): void {
		return;
	}

	listRefs(): ID[] {
		return [];
	}

	merge(remote: CRDTree<T> | CRDTreeTransport<T>): ID[] {
		return [];
	}

	onUpdate(callback: (update: CRDTreeTransport<T>) => void) {
		return;
	}

	ref(): ID {
		return undefined;
	}

	render(): T {
		return undefined;
	}

}
