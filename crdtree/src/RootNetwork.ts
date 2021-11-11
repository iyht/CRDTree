import {CRDTreeTransport} from "./CRDTree";

type ipv4addr = [number, string];

export interface INetwork<T = any> {

	// connect to an existing CRDTree network
	// calls itself and may connect to other nodes it learns about from host
	connect(host: ipv4addr): boolean;

	get_connected_roots(): ipv4addr[];

	// called by CRDTree to propagate to other processes
	send(update: CRDTreeTransport<T>): void;

	// when receiving an update, calls callback to let CRDTree handle it
	onRecv(callback: (update: CRDTreeTransport<T>) => void): void;
}

export class RootNetwork<T = any> implements INetwork<T> {
	tmp_trans: CRDTreeTransport<T>;

	constructor(port:number) {
		// set up server using port given


		// receive a connection to an existing CRDTree network
		// after establishing the socket, replies back all known nodes
		// may learn about new nodes from connecting node
	}

	get_connected_roots(): ipv4addr[]{
		return;
	};

	connect(host:ipv4addr): boolean {
		return;
	}

	send(update: CRDTreeTransport<T>): void {
		return;
	}

	onRecv(callback: <T>(update: CRDTreeTransport<T>) => void): void {
		return;
	}
}
