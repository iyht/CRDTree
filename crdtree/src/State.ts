import {ID, Index} from "./API";
import {HEAD, ROOT, ROOT_PARENT} from "./Constants";
import {BackendChange, Change, changeSortCompare, ensureBackendChange, toID} from "./Change";
import {
	BackendAssignment,
	BackendInsertion,
	BackendListAssignment,
	Deletion,
	isBackendAssignment,
	isBackendInsertion,
	isBackendListAssignment,
	isDeletion
} from "./Action";
import {BackendPrimitive, ObjectKind} from "./Primitive";
import {Entry, MetaMap, MetaObject} from "./StateObject";
import {assignToList, findIndexInTombstoneArray, findInsertionIndex, insertInList} from "./ArrayUtils";
import {render} from "./Renderer";
import {ensureNumber} from "./Util";

export default class State<T = any> {
	private objects: MetaMap;
	private _seen: Set<ID>;
	private _ref: ID;
	private clock: number;
	private readonly branches: Map<ID, BackendChange[]>;

	constructor(changes: BackendChange[]) {
		this._ref = ROOT;
		this.branches = new Map();
		this._seen = new Set<ID>();
		this.clock = 0;
		this.reinitObjects();
		this.addChanges(changes);
	}

	public addChanges(changes: Change[]): BackendChange[] {
		const backendChanges = changes
			.filter((change) => !this.seen(change))
			.map(ensureBackendChange);
		backendChanges.forEach((change) => {
			const {branch} = change;
			if (!this.branches.has(branch)) {
				this.branches.set(branch, []);
			}
			this.branches.get(branch).push(change);
		});
		const branch = this.collect();
		const newToCurrentBranch = branch.filter((change) => !this.seen(change));
		this.witness(newToCurrentBranch);
		if (newToCurrentBranch.length > 0 && newToCurrentBranch[0].clock > this.clock) {
			this.appendChanges(newToCurrentBranch);
			this.applyChanges(newToCurrentBranch);
		} else if (newToCurrentBranch.length > 0) {
			this.reapply(branch);
		}
		return newToCurrentBranch;
	}

	private collect(): BackendChange[] {
		// TODO more complicated that this...
		// TODO don't forget to do the sort `.sort(changeSortCompare);`
		return (this.branches.get(this.ref()) ?? []).sort(changeSortCompare);
	}

	private seen(change: Change | ID): boolean {
		const id: ID = typeof change === "string" ? change : toID(change);
		return this._seen.has(id);
	}

	private witness(changes: Change[]): void {
		changes.map(toID)
			.forEach((id: ID) => this._seen.add(id));
	}

	public next(): number {
		return this.clock + 1;
	}

	public latest(): ID | undefined {
		const branch = this.collect();
		if (branch.length > 0) {
			return toID(branch[branch.length - 1]);
		} else {
			return undefined;
		}
	}

	public getElement(indices: Index[]): ID {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getParentElement(indices: Index[]): ID {
		const element = this.getElementImpl([ROOT, ...indices].slice(0, -1));
		this.getMetaObject(element); // for side effect of asserting that this is indexable
		return element;
	}

	private getElementImpl(indices: Index[]): ID {
		return indices.reduce((name: ID, index: Index): ID => {
			const metaObject = this.getMetaObject(name);
			let entry: Entry;
			if (metaObject instanceof Map) {
				entry = metaObject.get(index);
			} else {
				entry = metaObject[findIndexInTombstoneArray(metaObject, ensureNumber(index))];
			}
			return entry?.deleted ? undefined :
				entry?.kind === ObjectKind.OTHER ? entry?.name : (entry?.value as ID);
		}, ROOT_PARENT) as ID;
	}

	private appendChanges(changes: BackendChange[]): void {
		this.clock = changes[changes.length - 1].clock;
	}

	private reapply(changes: BackendChange[]): void {
		this.reinitObjects();
		this.applyChanges(changes);
	}

	private reinitObjects(): void {
		const root = {name: undefined, kind: ObjectKind.OTHER, value: undefined, deleted: true};
		const rootParent = new Map<Index, Entry>().set(ROOT, root);
		this.objects = new Map<ID, Map<Index, Entry>>().set(ROOT_PARENT, rootParent);
	}

	private applyChanges(changes: BackendChange[]): void {
		changes
			.filter((change: BackendChange) => !change.dep || this.seen(change.dep))
			.forEach((change: BackendChange) => this.applyChange(change));
	}

	private applyChange(change: BackendChange): void {
		const {action} = change;
		if (isBackendAssignment(action)) {
			this.applyAssignment(action);
		} else if (isBackendListAssignment(action)) {
			this.applyListAssignment(action);
		} else if (isBackendInsertion(action)) {
			this.applyInsertion(action);
		} else if (isDeletion(action)) {
			this.applyDeletion(action);
		}
	}

	private getMetaObject(name: ID): MetaObject {
		const currentMap = this.objects.get(name);
		if (!currentMap) {
			throw new RangeError("Indexable element does not exist at this index");
		}
		return currentMap;
	}

	private createMetaObject(item: BackendPrimitive): void {
		const {name, kind} = item;
		if (kind === ObjectKind.OBJECT) {
			this.objects.set(name, new Map());
		} else if (kind === ObjectKind.ARRAY) {
			this.objects.set(name, []);
		}
	}

	private applyAssignment(assignment: BackendAssignment): void {
		const {item, at, in: _in} = assignment;
		const {name, value, kind} = item;
		const parent = this.getMetaObject(_in);
		if (Array.isArray(parent)) {
			throw new EvalError("Key assignment into a list should never happen");
		} else {
			parent.set(at, {name, value, kind, deleted: false});
		}
		this.createMetaObject(item);
	}

	private applyListAssignment(assignment: BackendListAssignment): void {
		const {item, at, in: _in} = assignment;
		const parent = this.getMetaObject(_in);
		if (Array.isArray(parent)) {
			assignToList(parent, at, item);
		} else {
			throw new EvalError("Index assignment into an object should never happen");
		}
		this.createMetaObject(item);
	}

	private applyInsertion(insertion: BackendInsertion): void {
		const {item, in: _in} = insertion;
		const parent = this.getMetaObject(_in);
		if (Array.isArray(parent)) {
			const index = findInsertionIndex(parent, insertion);
			insertInList(parent, index, item);
		} else {
			// TODO should really ensure this happens before application time
			throw new RangeError("Cannot insert into a non-list");
		}
		this.createMetaObject(item);
	}

	private applyDeletion(deletion: Deletion): void {
		const {at, in: _in} = deletion;
		const parent = this.getMetaObject(_in);
		if (Array.isArray(parent)) {
			parent
				.forEach((entry, index) =>
					(entry.name === at) && (parent[index] = {...entry, deleted: true}));
		} else {
			Array.from(parent.entries())
				.forEach(([name, entry]) =>
					(entry.name === at) && parent.set(name, {...entry, deleted: true}));
		}
	}

	public listChanges(): BackendChange[] {
		const changes = [];
		for (const branch of this.branches.values()) {
			changes.push(...branch);
		}
		return changes;
	}

	public render(): T {
		return render(this.objects);
	}

	public ref(): ID {
		return this._ref; // TODO
	}
}
