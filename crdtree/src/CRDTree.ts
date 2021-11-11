import State from "./State";

export type CRDTreeTransport<T> = Change[]; // used for sending updates across the network
export type ID = unknown; // used for identifying forks
export type Index = number | string;

type ROOT = "ROOT";
const ROOT = "ROOT";

type HEAD = "HEAD";
const HEAD = "HEAD";

type Primitive = string | number | boolean | null | [] | Record<string, never>;

enum ActionKind {
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

type Action = Assignment | Insertion | Deletion | NoOp;

type Change = {
	action: Action;
	pid: string;
	clock: number;
	deps: string[];
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

export class CRDTree<T = any> implements ICRDTree<T> {
	private readonly callbacks: Array<(update: CRDTreeTransport<T>) => void>;
	private readonly state: State;
	private readonly pid: string;

	constructor(from: CRDTreeTransport<T> = []) {
		this.callbacks = [];
		this.pid = String(Date.now()); // TODO lol
		this.state = new State(); // TODO need to add... pid? should handle the clock stuff
	}

	private makeChange(action: Action): void {
		this.insertChange({
			action: action,
			clock: this.state.tick(),
			deps: [],
			pid: this.pid,
		});
		this.callbacks.forEach(setImmediate); // TODO might want to tune this lol
	}

	private insertChange(change: Change): void {
		return;
	}

	private getElement(indices: Index[]): string {
		return "TODO"; // TODO
	}

	private getParentElement(indices: Index[]): string {
		return "TODO"; // TODO
	}

	public assign<U extends Primitive = any>(indices: Index[], item: U): void {
		const last = indices.map(String)[indices.length - 1] ?? ROOT;
		this.makeChange({
			at: last,
			in: this.getParentElement(indices),
			item,
			kind: ActionKind.ASSIGN
		});
	}

	public insert<U extends Primitive = any>(indices: [...Index[], number], item: U): void {
		const last: number = indices[indices.length - 1] as number;
		this.makeChange({
			after: this.getElement([...indices.slice(0, -1), last - 1]),
			in: this.getParentElement(indices),
			item,
			kind: ActionKind.INSERT,
		});
	}

	public delete(indices: Index[]): void {
		this.makeChange({
			at: this.getElement(indices),
			kind: ActionKind.DELETE,
		});
	}

	public noop(): void {
		this.makeChange({kind: ActionKind.NOOP});
	}

	public serialize(): CRDTreeTransport<T> {
		return undefined;
	}

	public merge(remote: CRDTree<T> | CRDTreeTransport<T>): ID[] {
		return [];
	}

	// ================ BENEATH HERE IS STUFF I DON'T WANT TO DEAL WITH YET ===========================================
	public render(): T {
		return undefined;
	}

	public onUpdate(callback: (update: CRDTreeTransport<T>) => void): void {
		this.callbacks.push(callback);
	}

	public fork(): ID {
		return undefined;
	}

	public join(ref: ID): void {
		return;
	}

	public listRefs(): ID[] {
		return [];
	}

	public ref(): ID {
		return undefined;
	}

	public checkout(ref: ID): void {
		return;
	}
}
