import {ID, Index} from "./types/Types";
import {ROOT, ROOT_PARENT} from "./Constants";
import {BackendChange, Change} from "./types/Change";
import {
	ActionKind,
	BackendAssignment,
	BackendInsertion,
	Deletion,
	isBackendAssignment,
	isBackendInsertion,
	isDeletion
} from "./types/BaseAction";
import {BasePrimitive, FrontendPrimitive, isBackendPrimitive, ObjectKind, ObjectPrimitive} from "./types/Primitive";

type Entry = { name: ID, value: BasePrimitive, deleted: boolean };
type MetaObject = Map<Index, Entry> | Array<Entry>;
type MetaMap = Map<ID, MetaObject>;

export default class State<T = any> {
	private objects: MetaMap;
	private clock: number;

	constructor(private readonly changes: BackendChange[]) {
		this.objects = State.initObjects();
		this.clock = changes[changes.length - 1]?.clock ?? 0;
		this.reapplyAllChanges();
	}

	private static initObjects(): Map<ID, Map<Index, Entry>> {
		const rootParent = new Map<Index, Entry>()
			.set(ROOT, {name: undefined, value: undefined, deleted: true});
		return new Map<ID, Map<Index, Entry>>()
			.set(ROOT_PARENT, rootParent);
	}

	public next(): number {
		return this.clock + 1;
	}

	public getElement(indices: Index[]): ID {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getParentElement(indices: Index[]): ID {
		const element = this.getElementImpl([ROOT, ...indices].slice(0, -1));
		this.getObjectProxy(element); // for side effect of asserting that this is indexable
		return element;
	}

	private getObjectProxy(name: ID): MetaObject {
		const currentMap = this.objects.get(name);
		if (!currentMap) {
			throw new RangeError("Indexable element does not exist at this index");
		}
		return currentMap;
	}

	private getElementImpl(indices: Index[]): ID {
		return indices.reduce((name: ID, index: Index): ID => {
			const metaObject = this.getObjectProxy(name);
			if (metaObject instanceof Map) {
				return metaObject.get(index).name;
			} else {
				// TODO
				return null;
			}
		}, ROOT_PARENT) as ID;
	}

	public addChange(change: Change): BackendChange {
		change = State.ensureBackendChange(change);
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

	private static ensureBackendChange(change: Change): BackendChange {
		const {kind} = change.action;
		if (kind === ActionKind.DELETE || kind === ActionKind.NOOP || isBackendPrimitive(change.action.item)) {
			return change as BackendChange;
		} else {
			const {pid, clock} = change;
			const name: ID = `${pid}@${clock}`;
			const item = State.toObjectPrimitive(name, change.action.item);
			const action = {...change.action, item};
			return {...change, action};
		}
	}

	// TODO def shouldn't be in this file
	private static toObjectPrimitive(name: ID, item: FrontendPrimitive): ObjectPrimitive {
		if (typeof item === "object" && item !== null) {
			return {name, value: undefined, kind: Array.isArray(item) ? ObjectKind.ARRAY : ObjectKind.OBJECT};
		} else {
			return {name, value: item as BasePrimitive, kind: ObjectKind.OTHER};
		}
	}

	private appendChange(change: BackendChange): void {
		this.clock = change.clock;
		this.changes.push(change);
	}

	private insertChange(change: BackendChange): void {
		// TODO something with the change itself. idk where it goes lol
		this.changes.push(change);
	}

	private reapplyAllChanges(): void {
		this.objects = State.initObjects();
		this.changes.forEach((change: BackendChange) =>
			this.applyChange(change));
	}

	private applyChange(change: BackendChange): void {
		const {action} = change;
		if (isBackendAssignment(action)) {
			this.applyAssignment(action);
		} else if (isBackendInsertion(action)) {
			this.applyInsertion(action);
		} else if (isDeletion(action)) {
			this.applyDeletion(action);
		}
	}

	private applyAssignment(assignment: BackendAssignment): void {
		const {item, at, in: _in} = assignment;
		if (!this.objects.has(_in)) {
			this.objects.set(_in, new Map());
		}
		const {name, value, kind} = item;
		// TODO what if assigning to a list thingy??????
		(this.objects.get(_in) as Map<Index, Entry>)
			.set(at, {name, value, deleted: false});
		if (kind === ObjectKind.OBJECT) {
			this.objects.set(name, new Map());
		} else if (kind === ObjectKind.ARRAY) {
			this.objects.set(name, []);
		}
	}

	private applyInsertion(insertion: BackendInsertion): void {
		// TODO aaaaaaaaa
	}

	private applyDeletion(deletion: Deletion): void {
		const {at, in: _in} = deletion;
		const parent = this.objects.get(_in);
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
		return this.changes;
	}

	public render(): T {
		const metaObject = this.objects.get(ROOT_PARENT) as Map<Index, Entry>;
		if (metaObject.get(ROOT).deleted) {
			return undefined;
		} else {
			return this.renderRecursiveMap(metaObject)[ROOT];
		}
	}

	private renderRecursiveMap(metaObject: Map<Index, Entry>): any {
		return Array.from(metaObject.entries()).reduce((element: any, [index, entry]): any => {
			if (entry.deleted) {
				return element;
			}
			if (this.objects.has(entry.name as ID)) {
				const {name} = entry;
				const metaObject = this.objects.get(name as ID);
				element[index] = Array.isArray(metaObject) ?
					this.renderRecursiveList(metaObject) : this.renderRecursiveMap(metaObject);
				return element;
			} else {
				element[index] = entry.value;
				return element;
			}
		}, {});
	}

	private renderRecursiveList(metaObject: Array<Entry>): any {
		return [];
	}
}
