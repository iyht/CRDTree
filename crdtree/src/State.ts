import {Index} from "./Types";
import {ROOT, ROOT_PARENT} from "./Constants";

type MetaMap = Map<string, Map<Index, string>>;

export default class State {
	private readonly objects: MetaMap;

	constructor(private ticker: number = 0) {
		this.objects = new Map<string, Map<Index, string>>();
		this.objects.set(ROOT_PARENT, new Map<Index, string>());
	}

	public tick(): number {
		this.ticker = this.ticker + 1;
		return this.ticker;
	}

	public getElement(indices: Index[]): string {
		return this.getElementImpl([ROOT, ...indices]);
	}

	public getParentElement(indices: Index[]): string {
		const element = this.getElement([ROOT, ...indices].slice(0, -1));
		this.getObjectProxy(element); // for side effect of asserting that this is indexable
		return element;
	}

	private getObjectProxy(name: string): Map<Index, string> {
		const currentMap = this.objects.get(name);
		if (!currentMap) {
			throw new RangeError("Indexable element does not exist at this index");
		}
		return currentMap;
	}

	private getElementImpl(indices: Index[]): string {
		return indices.reduce((name: string, index: Index): string =>
			this.getObjectProxy(name).get(index), ROOT_PARENT) as string;
	}
}
