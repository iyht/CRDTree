import {connectTo, initNetwork} from "../src/Network";
import {expect} from "chai";
import {IConnectedCRDTree} from "../src/ConnectedCRDTree";

describe("Network", () => {
	let crdtA: IConnectedCRDTree;
	let crdtB: IConnectedCRDTree;

	it("should be able to init a network", async () => {
		crdtA = await initNetwork();
		expect(crdtA.id).to.be.a.string("Peer ID A");
		expect(crdtA.peerIds).to.be.empty;
	});

	it("should be able to join a network", async function () {
		this.timeout(10000);
		crdtB = await connectTo([crdtA.id]);
		expect(crdtB.id).to.be.a.string("Peer ID B");
		expect(crdtB.peerIds).to.deep.equal([crdtA.id]);
		expect(crdtA.peerIds).to.deep.equal([crdtB.id]);
	});
});
