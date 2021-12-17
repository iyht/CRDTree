import {connectTo, initNetwork} from "../src/Network";
import {expect} from "chai";
import {IConnectedCRDTree} from "../src/ConnectedCRDTree";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Network", function () {
	this.timeout(10000);

	let crdtA: IConnectedCRDTree;
	let crdtB: IConnectedCRDTree;
	let crdtC: IConnectedCRDTree;

	after(() => Promise.all([
		crdtA.stop(),
		crdtB.stop(),
		crdtC.stop(),
	]));

	describe("Network setup", () => {
		it("should be able to init a network", async () => {
			crdtA = await initNetwork();
			expect(crdtA.addresses).to.not.be.empty;
		});

		it("should be able to join a network", async () => {
			crdtB = await connectTo(crdtA.addresses);
			expect(crdtB.addresses).to.not.be.empty;
		});

		it("should be able to join a network from non-originator node", async () => {
			crdtC = await connectTo(crdtB.addresses);
			expect(crdtC.addresses).to.not.be.empty;
		});
	});

	describe("CRDT", () => {
		it("should have changes move to other nodes", async () => {
			crdtA.assign([], "foo");
			expect(crdtA.render).to.deep.equal("foo");
			await sleep(5000);
			expect(crdtB.render).to.deep.equal("foo");
		});
	});
});
