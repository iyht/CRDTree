import {BackendChange, Change, ID, Index} from "./types/Types";
import {ROOT, ROOT_PARENT} from "./Constants";

type MetaMap = Map<ID, Map<Index, ID>>;

export default class State {
	private objects: MetaMap;
	private readonly changes: BackendChange[];

	constructor(private clock: number = 0) {
		this.objects = this.initObjects();
		this.changes = [];
	}

	private initObjects(): Map<ID, Map<Index, ID>> {
		return new Map<ID, Map<Index, ID>>()
			.set(ROOT_PARENT, new Map<Index, ID>());
	}

	public tick(): number {
		this.clock = this.clock + 1;
		return this.clock;
	}

	public getElement(indices: Index[]): ID {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getParentElement(indices: Index[]): ID {
		const element = this.getElement([ROOT, ...indices].slice(0, -1));
		this.getObjectProxy(element); // for side effect of asserting that this is indexable
		return element;
	}

	private getObjectProxy(name: ID): Map<Index, ID> {
		const currentMap = this.objects.get(name);
		if (!currentMap) {
			throw new RangeError("Indexable element does not exist at this index");
		}
		return currentMap;
	}

	private getElementImpl(indices: Index[]): ID {
		return indices.reduce((name: ID, index: Index): ID =>
			this.getObjectProxy(name).get(index), ROOT_PARENT) as ID;
	}

	public addChange(change: Change): void {
		const {clock} = change;
		if (clock > this.clock) {
			this.appendChange(change);
			this.applyChange(change);
		} else {
			this.insertChange(change);
		}
	}

	private ensureBackendChange(change: Change): BackendChange {
		// TODO
		return null;
	}

	private appendChange(change: Change): void {
		this.changes.push(this.ensureBackendChange(change));
	}

	private insertChange(newChange: Change): void {
		// TODO something with the change itself. idk where it goes lol
		this.initObjects();
		this.changes.forEach((change: Change) =>
			this.applyChange(change));
	}

	private applyChange(change: Change): void {
		const {kind} = change.action;
	}

	public listChanges(): BackendChange[] {
		return this.changes;
	}
}
