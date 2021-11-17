import {ID, Index} from "./API";
import {ROOT, ROOT_PARENT} from "./Constants";
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
import {nameClockLt, nameLt} from "./Clock";

export default class State<T = any> {
	private objects: MetaMap;
	private _seen: Set<ID>;
	private clock: number;

	constructor(private readonly changes: BackendChange[]) {
		this.clock = changes[changes.length - 1]?.clock ?? 0;
		this._seen = new Set<ID>();
		this.witness(this.changes);
		this.reapplyAllChanges();
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
		if (this.changes.length > 0) {
			return toID(this.changes[this.changes.length - 1]);
		} else {
			return undefined;
		}
	}

	public getElementID(indices: Index[]): ID {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getEnclosingObjectID(indices: Index[]): ID {
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
				entry = metaObject[findIndexInTombstoneArray(metaObject, State.ensureNumber(index))];
			}
			return entry?.deleted ? undefined :
				entry?.kind === ObjectKind.OTHER ? entry?.creator : (entry?.value as ID);
		}, ROOT_PARENT) as ID;
	}

	private static ensureNumber(maybeNumber: any): number {
		if (typeof maybeNumber !== "number" || !isFinite(maybeNumber)) {
			throw new RangeError("Must use numbers to index into arrays");
		}
		return maybeNumber; // definitely number
	}

	public addChange(changes: Change[]): BackendChange[] {
		const backendChanges = changes
			.filter((change) => !this.seen(change))
			.map(ensureBackendChange)
			.sort(changeSortCompare);
		this.witness(backendChanges);
		if (backendChanges.length > 0 && backendChanges[0].clock > this.clock) {
			this.appendChanges(backendChanges);
			this.applyChanges(backendChanges);
		} else if (backendChanges.length > 0) {
			this.insertChanges(backendChanges);
			const store = this.clock; // TODO temporary fix -- don't allow this to get merged
			this.applyChanges(backendChanges);
			this.clock = store;
		}
		return backendChanges;
	}

	private appendChanges(changes: BackendChange[]): void {
		this.clock = changes[changes.length - 1].clock;
		this.changes.push(...changes);
	}

	private insertChanges(changes: BackendChange[]): void {
		this.changes.push(...changes);
		this.changes.sort(changeSortCompare);
	}

	private reapplyAllChanges(): void {
		const name: ID = "@-1";
		const root = {creator: name, editor: name, kind: ObjectKind.OTHER, value: undefined, deleted: undefined};
		const rootParent = new Map<Index, Entry>().set(ROOT, root);
		this.objects = new Map<ID, Map<Index, Entry>>().set(ROOT_PARENT, rootParent);
		this.applyChanges(this.changes);
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
			this.applyDeletion(action, toID(change));
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
			if (!parent.has(at)) {
				parent.set(at, {creator: name, editor: name, value, kind, deleted: undefined});
			} else {
				const existing = parent.get(at);
				const {creator, editor} = existing;
				let deleted;
				if (!existing.deleted) {
					deleted = undefined;
				} else {
					if (nameClockLt(existing.deleted, name)) { // was deleted before the assignment
						deleted = undefined;
					} else {
						deleted = existing.deleted;
					}
				}
				if (nameLt(editor, name)) { // if existing happened before
					parent.set(at, {creator, editor: name, value, kind, deleted});
				}
			}
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

	private applyDeletion(deletion: Deletion, when: ID): void {
		const {at, in: _in} = deletion;
		const parent = this.getMetaObject(_in);
		const predicate = (entry: Entry) =>
			nameClockLt(entry.creator, when) &&
			(entry.creator === at || (entry.kind !== ObjectKind.OTHER && entry.value === at))
		if (Array.isArray(parent)) {
			parent
				.forEach((entry, index) =>
					predicate(entry) && (parent[index] = {
						...entry,
						deleted: when
					}));
		} else {
			Array.from(parent.entries())
				.forEach(([index, entry]) =>
					predicate(entry) && parent.set(index, {
						...entry,
						deleted: when
					}));
		}
	}

	public listChanges(): BackendChange[] {
		return this.changes.slice();
	}

	public render(): T {
		const metaObject = this.getMetaObject(ROOT_PARENT) as Map<Index, Entry>;
		if (metaObject.get(ROOT).deleted) {
			return undefined;
		} else {
			return this.renderRecursiveMap(metaObject)[ROOT];
		}
	}

	private renderRecursiveMap(metaObject: Map<Index, Entry>): any {
		return Array.from(metaObject.entries()).reduce((element: any, [index, entry]): any => {
			if (!entry.deleted) {
				element[index] = this.renderRecursive(entry);
			}
			return element;
		}, {});
	}

	private renderRecursiveList(metaObject: Array<Entry>): any {
		return metaObject.filter((entry) => !entry.deleted)
			.map((entry) => this.renderRecursive(entry));
	}

	private renderRecursive(entry: Entry): any {
		const {value, kind} = entry;
		if (kind !== ObjectKind.OTHER) {
			const metaObject = this.getMetaObject(value as ID);
			return Array.isArray(metaObject) ?
				this.renderRecursiveList(metaObject) : this.renderRecursiveMap(metaObject);
		} else {
			return value;
		}
	}
}
