import State from "./State";
import {BranchID, CRDTreeTransport, ICRDTree, ID, Index} from "./API";
import {ROOT} from "./Constants";
import {BackendChange, Change} from "./Change";
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

	private makeChange(action: FrontendAction, ref?: BranchID): void {
		const backendChanges = this.insertChanges([{
			action: action,
			clock: this.state.next(),
			pid: this.pid,
			dep: this.state.latest(),
			branch: ref ?? this.state.getBranchID(),
		}]);
		this.callbacks.forEach((callback) =>
			setImmediate(callback, backendChanges));
	}

	private insertChanges(changes: Change[]): BackendChange[] {
		return this.state.addChange(changes);
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
				at: last,
				in: this.getParentElement(indices),
				item,
				kind: ActionKind.ASSIGN,
			});
		} else {
			this.makeChange({
				at: this.getElement(indices),
				in: this.getParentElement(indices),
				item,
				kind: ActionKind.ASSIGN_LIST,
			});
		}
	}

	public insert<U extends FrontendPrimitive = any>(indices: [...Index[], number], item: U): void {
		assertSerializable(item);
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
			in: this.getParentElement(indices),
			at: this.getElement(indices),
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
		this.insertChanges(changes);

		// ================ BENEATH HERE IS STUFF I DON'T WANT TO DEAL WITH YET =======================================
		return [];
	}

	public fork(): BranchID {
		let newBranch: BranchID = uuid();
		this.forkWithRef(newBranch);
		this.checkout(newBranch);
		return newBranch;
	}

	private forkWithRef(ref: BranchID): void {
		this.makeChange({
			kind: ActionKind.FORK,
			parent: this.state.latest(),
			parentBranch: this.state.getBranchID(),
		}, ref);
	}

	public join(ref: BranchID): void {
		this.makeChange({
			kind: ActionKind.JOIN,
			joinedAt: this.state.latestFrom(ref),
			joinedBranch: ref,
		});
		this.checkout(this.state.getBranchID());
		return;
	}

	public listRefs(): BranchID[] {
		return this.state.getAllBranches();
	}

	public ref(): BranchID {
		return this.state.getBranchID();
	}

	public checkout(ref: BranchID): void {
		this.state.changeBranch(ref);
		return;
	}
}
