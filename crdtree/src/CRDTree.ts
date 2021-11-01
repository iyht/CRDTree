export type CRDTreeTransport<T> = unknown[]; // used for sending updates across the network
export type ID = unknown;
export type Index = number | string;

export interface ICRDTree<T = any> {
	render(): T;

	serialize(): CRDTreeTransport<T>; // for when a new node joins the network
	// returns affected forks
	merge(remote: ICRDTree<T> | CRDTreeTransport<T>): ID[];

	assign<U = any>(indices: Index[], item: U): void;
	insert<U = any>(indices: [...Index[], number], item: U): void;
	delete(indices: Index[]): void;
	noop(): void; // useful when we add commit messages

	onUpdate(callback: (update: CRDTreeTransport<T>) => void);

	ref(): ID;
	listRefs(): ID[];
	fork(): ID;
	join(ref: ID): void; // same fork is a no-op
	checkout(ref: ID): void;
}

export class CRDTree<T = any> implements ICRDTree<T> {
	private callback;

	constructor(from: CRDTreeTransport<T> = []) {
		// TODO
	}

	assign<U = any>(indices: Index[], item: U): void {
		this.callback && setTimeout(this.callback);
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

	noop() {
		return;
	}

	onUpdate(callback: (update: CRDTreeTransport<T>) => void) {
		this.callback = callback;
		return;
	}

	ref(): ID {
		return undefined;
	}

	render(): T {
		return undefined;
	}

}
