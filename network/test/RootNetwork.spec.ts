import {connectTo, initNetwork} from "../src/Network";
import {expect} from "chai";
import {IConnectedCRDTree} from "../src/ConnectedCRDTree";
import {sleep} from "./util";

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
			await sleep(500);
			expect(crdtB.render).to.deep.equal("foo");
			expect(crdtC.render).to.deep.equal("foo");
		});

		it("should have changes go back to the initial node", async () => {
			crdtB.assign([], "bar");
			expect(crdtB.render).to.deep.equal("bar");
			await sleep(500);
			expect(crdtA.render).to.deep.equal("bar");
			expect(crdtC.render).to.deep.equal("bar");
		});
	});
});

// TODO test with a node dropping out
// TODO test with basic network thingy
