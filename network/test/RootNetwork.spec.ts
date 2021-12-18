import {connectTo, initNetwork} from "../src/Network";
import {expect} from "chai";
import {ConnectedCRDTree, IConnectedCRDTree} from "../src/ConnectedCRDTree";
import {sleep} from "./util";
import {ProtocolKind} from "../src/protocol/Protocol";

describe("Network", () => {

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

	describe("Joining and leaving", () => {
		let crdtD: ConnectedCRDTree;
		it("should be able to get bootstrapped", async () => {
			crdtD = await connectTo(crdtC.addresses) as ConnectedCRDTree;
			expect(crdtD.render).to.deep.equal(crdtA.render);
			expect(crdtD.protocolKind).to.deep.equal(ProtocolKind.RECOMMENDED);
		});

		it("should be possible to stop a node", async () => {
			await crdtD.stop();
		});
	});

	describe("CRDTree", () => {
		it("should be able to checkout something that you were not following", async () => {
			const change = "MADE ON BRANCH A";
			crdtA.fork("A");
			crdtA.noop();
			crdtA.assign([], change);
			crdtA.noop();

			await sleep(400);
			expect(crdtB.render).to.deep.equal("bar");
			expect(crdtB.listRefs()).includes("A");
			crdtB.checkout("A");
			await sleep(400);
			expect(crdtB.render).to.deep.equal(change);
		});

		it("should be able to join something that you were not following", async () => {
			const change = "MADE ON BRANCH A PRIME";
			crdtA.fork("A'");
			crdtA.noop();
			crdtA.assign([], change);
			crdtA.noop();

			await sleep(600);
			expect(crdtB.listRefs()).includes("A'");
			crdtB.join("A'");
			await sleep(400);
			expect(crdtB.render).to.deep.equal(change);
		});
	});
});

// TODO test with a node dropping out
// TODO test with basic network thingy
