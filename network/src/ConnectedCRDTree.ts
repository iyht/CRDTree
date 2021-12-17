import {CRDTreeTransport} from "../../crdtree";
import Libp2p from "libp2p";
import {ICRDTree} from "crdtree";
import {debounce} from "debounce";

interface IConnectedCRDTree<T = any> extends ICRDTree {

	addresses: string[];

	onUpdate(callback: (render) => void): void;

	stop(): Promise<void>;
}

class ConnectedCRDTree<T = any> implements IConnectedCRDTree<T> {
	private pendingUpdates: CRDTreeTransport<T>;

	constructor(private readonly node: Libp2p, private readonly crdt: ICRDTree) {
		this.pendingUpdates = [];
		this.crdt.onUpdate((update) => {
			this.pendingUpdates.push(...update);
			this.broadcast();
		});
	}

	public get addresses(): string[] {
		const peerId = this.node.peerId.toB58String();
		return this.node.transportManager.getAddrs()
			.map((addr) => `${addr.toString()}/p2p/${peerId}`);
	}

	public assign(indices: Array<number | string>, item: any): void {
		this.crdt.assign(indices, item);
	}

	public insert(indices: [...Array<number | string>, number], item: any): void {
		this.crdt.insert(indices, item);
	}

	public delete(indices: Array<number | string>): void {
		this.crdt.delete(indices);
	}

	public get render(): any {
		return this.crdt.render;
	}

	public onUpdate(callback: (render: any) => void): void {
		// TODO
	}

	public async stop(): Promise<void> {
		Object.keys(this)
			.filter((key) => this[key] instanceof Function)
			.forEach((key) => this[key] = () => {
				throw new Error("Cannot use a stopped CRDTree");
			});
		// TODO something something... broadcast metadata details
		await this.node.stop();
	}

	private readonly broadcast: () => void = debounce(async () => {
		const updatesToBroadcast = this.pendingUpdates;
		this.pendingUpdates = [];

		try {
			// Publish the message
			const message = JSON.stringify(updatesToBroadcast);
			const buffer = Buffer.from(message);
			// await this.pubsubChat.send(buffer);
		} catch (err) {
			this.pendingUpdates.push(...updatesToBroadcast); // hopefully will get handled later
			console.warn("Updates couldn't get published. Will publish later. Reason:", err);
		}
	}, 200);

	// TODO
	checkout(ref: string): void {
	}

	fork(name?: string): string {
		return "";
	}

	join(ref: string): void {
	}

	listRefs(): string[] {
		return [];
	}

	merge(remote: ICRDTree<any> | CRDTreeTransport<any>): string[] {
		return [];
	}

	noop(): void {
	}

	ref(): string {
		return "";
	}

	serialize(): CRDTreeTransport<any> {
		return undefined;
	}
}

export {IConnectedCRDTree, ConnectedCRDTree}
