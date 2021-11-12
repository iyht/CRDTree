import State from "./State";
import {
	ICRDTree,
	ID,
	Index
} from "./types/Types";
import {ROOT} from "./Constants";
import {BackendChange, Change} from "./types/Change";
import {ActionKind, FrontendAction} from "./types/BaseAction";
import {FrontendPrimitive} from "./types/Primitive";

export type CRDTreeTransport<T> = BackendChange[]; // used for sending updates across the network

export class CRDTree<T = any> implements ICRDTree<T> {
	private readonly callbacks: Array<(update: CRDTreeTransport<T>) => void>;
	private readonly state: State<T>;
	private readonly pid: string;

	constructor(from: CRDTreeTransport<T> = []) {
		this.callbacks = [];
		this.pid = String(Date.now()); // TODO lol
		this.state = new State<T>(from);
	}

	private makeChange(action: FrontendAction): void {
		this.insertChange({
			action: action,
			clock: this.state.next(),
			// deps: [], // TODO probably need this but not sure how it works just yet?
			pid: this.pid,
		});
		this.callbacks.forEach(setImmediate); // TODO might want to tune this lol
	}

	private insertChange(change: Change): void {
		this.state.addChange(change);
	}

	private getElement(indices: Index[]): ID {
		return this.state.getElement(indices);
	}

	private getParentElement(indices: Index[]): ID {
		return this.state.getParentElement(indices);
	}

	public assign<U extends FrontendPrimitive = any>(indices: Index[], item: U): void {
		const last = indices.map(String)[indices.length - 1] ?? ROOT;
		this.makeChange({
			at: last,
			in: this.getParentElement(indices),
			item,
			kind: ActionKind.ASSIGN
		});
	}

	public insert<U extends FrontendPrimitive = any>(indices: [...Index[], number], item: U): void {
		const last: number = indices[indices.length - 1] as number;
		this.makeChange({
			after: this.getElement([...indices.slice(0, -1), last - 1]),
			in: this.getParentElement(indices),
			item,
			kind: ActionKind.INSERT,
		});
	}

	public delete(indices: Index[]): void {
		const last = indices.map(String)[indices.length - 1] ?? ROOT;
		this.makeChange({
			in: this.getParentElement(indices),
			at: last,
			kind: ActionKind.DELETE,
		});
	}

	public noop(): void {
		this.makeChange({
			kind: ActionKind.NOOP,
		});
	}

	public serialize(): CRDTreeTransport<T> {
		return this.state.listChanges();
	}

	public render(): T {
		return this.state.render();
	}

	public onUpdate(callback: (update: CRDTreeTransport<T>) => void): void {
		this.callbacks.push(callback);
	}

	public merge(remote: CRDTree<T> | CRDTreeTransport<T>): ID[] {
		const changes = remote instanceof CRDTree ? remote.serialize() : remote;
		changes.forEach((change: BackendChange) => this.insertChange(change));

		// ================ BENEATH HERE IS STUFF I DON'T WANT TO DEAL WITH YET =======================================
		return [];
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
