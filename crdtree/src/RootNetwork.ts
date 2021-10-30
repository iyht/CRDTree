import {CRDTreeTransport} from "./CRDTree";

export type asd = any;

export interface INetwork<T = any> {

	// connect to an existing CRDTree network
	// calls itself and may connect to other nodes it learns about from host
	connect(port: number, host: string): void;

	// receive a connection to an existing CRDTree network
	// after establishing the socket, replies back all known nodes
	// may learn about new nodes from connecting node
	onConnect(socket): void;

	// called by CRDTree to propagate to other processes
	send(update: CRDTreeTransport<T>): void;

	// when receiving an update, calls callback to let CRDTree handle it
	onRecv(callback: (update: CRDTreeTransport<T>) => void): void;
}

export class RootNetwork<T = any> implements INetwork<T> {
	constructor(port:number) {
		// set up server using port given

	}
	connect(port: number, host: string): void {
		return;
	}

	onConnect(socket): void {
		return;
	}

	send(update: CRDTreeTransport<T>): void {
		return;
	}

	onRecv(callback: <T>(update: CRDTreeTransport<T>) => void): void {
		return;
	}
}
