import {ID, Index} from "./API";
import {ROOT, ROOT_PARENT} from "./Constants";
import {BackendChange, Change, ensureBackendChange, toID} from "./Change";
import {
	ActionKind,
	BackendAssignment,
	BackendInsertion,
	BackendListAssignment,
	Deletion,
	isBackendAssignment,
	isBackendInsertion,
	isBackendListAssignment,
	isDeletion
} from "./types/BaseAction";
import {BackendPrimitive, ObjectKind} from "./Primitive";
import {clockLt} from "./Clock";
import {Entry, MetaMap, MetaObject} from "./StateObject";
import {assignToList, findIndexInTombstoneArray, findInsertionIndex, insertInList} from "./ArrayUtils";

export default class State<T = any> {
	private objects: MetaMap;
	private _seen: Set<ID>;
	private clock: number;

	constructor(private readonly changes: BackendChange[]) {
		this.clock = changes[changes.length - 1]?.clock ?? 0;
		this._seen = new Set<ID>();
		this.changes.forEach((change) => this.witness(change));
		this.reapplyAllChanges();
	}

	public seen(change: Change): boolean {
		return this._seen.has(toID(change));
	}

	private witness(change: Change): void {
		this._seen.add(toID(change));
	}

	public next(): number {
		return this.clock + 1;
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
				entry = metaObject[findIndexInTombstoneArray(metaObject, State.ensureNumber(index))];
			}
			return entry?.deleted ? undefined :
				entry?.kind === ObjectKind.OTHER ? entry?.name : (entry?.value as ID);
		}, ROOT_PARENT) as ID;
	}

	private static ensureNumber(maybeNumber: any): number {
		if (typeof maybeNumber !== "number" || !isFinite(maybeNumber)) {
			throw new RangeError("Must use numbers to index into arrays");
		}
		return maybeNumber; // definitely number
	}

	public addChange(change: Change): BackendChange {
		change = ensureBackendChange(change);
		this.witness(change);
		const {clock} = change;
		if (clock > this.clock) {
			this.appendChange(change);
			this.applyChange(change);
		} else {
			this.insertChange(change);
			this.reapplyAllChanges();
		}
		return change;
	}

	private appendChange(change: BackendChange): void {
		this.clock = change.clock;
		this.changes.push(change);
	}

	private insertChange(change: BackendChange): void {
		if (change.action.kind === ActionKind.DELETE) {
			// TODO if deletion, insert as early as possible
		} else {
			// TODO else insert as late as possible
		}
		this.changes.push(change);
		this.changes.sort((a, b) => {
			if (clockLt(a, b)) {
				return -1;
			} else {
				return 1;
			}
		});
	}

	private reapplyAllChanges(): void {
		const root = {name: undefined, kind: ObjectKind.OTHER, value: undefined, deleted: true};
		const rootParent = new Map<Index, Entry>().set(ROOT, root);
		this.objects = new Map<ID, Map<Index, Entry>>().set(ROOT_PARENT, rootParent);
		this.changes.forEach((change: BackendChange) => this.applyChange(change));
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
			if (entry.deleted === false) {
				element[index] = this.renderRecursive(entry);
			}
			return element;
		}, {});
	}

	private renderRecursiveList(metaObject: Array<Entry>): any {
		return metaObject.filter((entry) => entry.deleted === false)
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
