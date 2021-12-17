import State from "./State";
import {CRDTreeTransport, ICRDTree, ID, Index} from "./API";
import {ROOT} from "./Constants";
import {BackendChange, Change, FrontendChange} from "./Change";
import {ActionKind, FrontendAction} from "./Action";
import {FrontendPrimitive} from "./Primitive";
import {assertSerializable} from "./Util";
import {uuid} from "./UUID";

export class CRDTree<T = any> implements ICRDTree<T> {
	private readonly callbacks: Array<(update: CRDTreeTransport<T>) => void>;
	private readonly state: State<T>;
	private readonly pid: string;

	constructor(from: CRDTreeTransport<T> = [], pid?: string) {
		this.callbacks = [];
		this.pid = pid ?? uuid();
		this.state = new State<T>(from);
	}

	private makeChange(change: { action: FrontendAction } | FrontendChange): void {
		this.insertChanges([{
			clock: this.state.next(),
			pid: this.pid,
			branch: this.state.ref(),
			dep: this.state.latest(),
			...change,
		}]);
	}

	private insertChanges(changes: Change[]): void {
		const backendChanges = this.state.addChanges(changes);
		if (backendChanges.length > 0) {
			this.callbacks.forEach((callback) =>
				setImmediate(callback, backendChanges));
		}
	}

	private getElement(indices: Index[]): ID {
		return this.state.getElement(indices);
	}

	private getParentElement(indices: Index[]): ID {
		return this.state.getParentElement(indices);
	}

	public assign<U extends FrontendPrimitive = any>(indices: Index[], item: U): void {
		assertSerializable(item);
		const last = indices[indices.length - 1] ?? (ROOT as Index);
		if (typeof last === "string") {
			this.makeChange({
				action: {
					at: last,
					in: this.getParentElement(indices),
					item,
					kind: ActionKind.ASSIGN,
				}
			});
		} else {
			this.makeChange({
				action: {
					at: this.getElement(indices),
					in: this.getParentElement(indices),
					item,
					kind: ActionKind.ASSIGN_LIST,
				}
			});
		}
	}

	public insert<U extends FrontendPrimitive = any>(indices: [...Index[], number], item: U): void {
		assertSerializable(item);
		const last: number = indices[indices.length - 1] as number;
		this.makeChange({
			action: {
				after: this.getElement([...indices.slice(0, -1), last - 1]),
				in: this.getParentElement(indices),
				item,
				kind: ActionKind.INSERT,
			}
		});
	}

	public delete(indices: Index[]): void {
		this.makeChange({
			action: {
				in: this.getParentElement(indices),
				at: this.getElement(indices),
				kind: ActionKind.DELETE,
			}
		});
	}

	public noop(): void {
		this.makeChange({
			action: {
				kind: ActionKind.NOOP,
			}
		});
	}

	public serialize(): CRDTreeTransport<T> {
		return this.state.listChanges();
	}

	public get render(): T {
		return this.state.render();
	}

	public onUpdate(callback: (update: CRDTreeTransport<T>) => void): void {
		this.callbacks.push(callback);
	}

	public fork(name?: string): string {
		const from = this.state.ref();
		const clock = this.state.next();
		const dep = this.state.latest();
		const branch = name || uuid();
		const {pid} = this;
		this.state.checkout(branch); // VERY EXPENSIVE/WASTEFUL reapplication here lol
		this.makeChange({
			action: {
				kind: ActionKind.FORK,
				from,
				after: dep,
			},
			clock,
			pid,
			branch,
			dep,
		});
		return branch;
	}

	public join(ref: string): void {
		this.makeChange({
			action: {
				kind: ActionKind.JOIN,
				from: ref,
				after: this.state.latest(ref),
			}
		});
	}

	public get ref(): string {
		return this.state.ref();
	}

	public merge(remote: CRDTree<T> | CRDTreeTransport<T>): string[] {
		const changes = remote instanceof CRDTree ? remote.serialize() : remote;
		this.insertChanges(changes);

		// ================ BENEATH HERE IS STUFF I DON'T WANT TO DEAL WITH YET =======================================
		return []; // TODO
	}

	public listRefs(): string[] {
		return this.state.listRefs();
	}

	public checkout(ref: string): void {
		this.state.checkout(ref);
	}
}
