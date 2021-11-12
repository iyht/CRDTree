import {ID, Index} from "./types/Types";
import {ROOT, ROOT_PARENT} from "./Constants";
import {BackendChange, Change} from "./types/Change";
import {
	ActionKind,
	BackendAssignment,
	BackendInsertion, Deletion,
	isBackendAssignment,
	isBackendInsertion, isDeletion
} from "./types/BaseAction";
import {
	BasePrimitive,
	isBackendPrimitive,
	ObjectKind,
	ObjectPrimitive
} from "./types/Primitive";

type Entry = { name: ID | BasePrimitive, deleted: boolean };
type MetaMap = Map<ID, Map<Index, Entry>>;

export default class State<T = any> {
	private objects: MetaMap;
	private clock: number;

	constructor(private changes: BackendChange[]) {
		this.objects = State.initObjects();
		this.clock = changes[changes.length - 1]?.clock ?? 0;
		this.reapplyAllChanges();
	}

	private static initObjects(): Map<ID, Map<Index, Entry>> {
		const rootParent = new Map<Index, Entry>()
			.set(ROOT, { name: undefined, deleted: false });
		return new Map<ID, Map<Index, Entry>>()
			.set(ROOT_PARENT, rootParent);
	}

	public next(): number {
		return this.clock + 1; // TODO missing some math.max somewhere...
	}

	public getElement(indices: Index[]): ID {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getParentElement(indices: Index[]): ID {
		const element = this.getElementImpl([ROOT, ...indices].slice(0, -1));
		this.getObjectProxy(element); // for side effect of asserting that this is indexable
		return element;
	}

	private getObjectProxy(name: ID): Map<Index, Entry> {
		const currentMap = this.objects.get(name);
		if (!currentMap) {
			throw new RangeError("Indexable element does not exist at this index");
		}
		return currentMap;
	}

	private getElementImpl(indices: Index[]): ID {
		return indices.reduce((name: ID, index: Index): ID =>
			this.getObjectProxy(name).get(index).name as ID, ROOT_PARENT) as ID;
	}

	public addChange(change: Change): void {
		change = State.ensureBackendChange(change);
		const {clock} = change;
		if (clock > this.clock) {
			this.appendChange(change);
			this.applyChange(change);
		} else {
			this.insertChange(change);
			this.reapplyAllChanges();
		}
	}

	private static ensureBackendChange(change: Change): BackendChange {
		const {kind} = change.action;
		if (kind === ActionKind.DELETE || kind === ActionKind.NOOP || isBackendPrimitive(change.action.item)) {
			return change as BackendChange;
		} else {
			const {pid, clock} = change;
			const kind = Array.isArray(change.action.item) ? ObjectKind.ARRAY : ObjectKind.OBJECT;
			const name: ID = `${pid}@${clock}`;
			const item = {name, kind};
			const action = {...change.action, item};
			return {...change, action};
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
		if (item && item["name"]) {
			const objectDescription = item as ObjectPrimitive;
			this.objects.get(_in).set(at, {name: objectDescription.name, deleted: false});
			this.objects.set(objectDescription.name, new Map());
		} else {
			this.objects.get(_in).set(at, {name: item as BasePrimitive, deleted: false});
		}
	}

	private applyInsertion(insertion: BackendInsertion): void {
		// TODO aaaaaaaaa
	}

	private applyDeletion(deletion: Deletion): void {
		const {at, in: _in} = deletion;
		const entry = this.objects.get(_in).get(at);
		if (entry) {
			this.objects.get(_in).set(at, {...entry, deleted: true});
		}
	}

	public listChanges(): BackendChange[] {
		return this.changes;
	}

	public render(): T {
		const metaObject = this.objects.get(ROOT_PARENT);
		if (metaObject.get(ROOT).deleted) {
			return undefined;
		} else {
			return this.renderRecursive(metaObject)[ROOT];
		}
	}

	private renderRecursive(metaObject: Map<Index, Entry>): any {
		return Array.from(metaObject.entries()).reduce((element: any, [index, entry]): any => {
			if (entry.deleted) {
				return element;
			} if (this.objects.has(entry.name as ID)) {
				const {name} = entry;
				element[index] = this.renderRecursive(this.objects.get(name as ID));
				return element;
			} else {
				element[index] = entry.name;
				return element;
			}
		}, {});
	}
}
