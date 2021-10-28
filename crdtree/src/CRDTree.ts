type CRDTreeTransport<T> = unknown; // used for sending updates across the network
type ID = unknown;
type Index = number | string;

interface CRDTree<T = any> {
	// new (intialState: T): CRDTree<T>;
	// new (from: CRDTreeTransport<T>): CRDTree<T>;

	render(): T;

	clone(): CRDTreeTransport<T>; // for when a new node joins the network
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
