import {connectTo, initNetwork} from "../src/Network";
import {expect} from "chai";
import {IConnectedCRDTree} from "../src/ConnectedCRDTree";

describe("Network", function () {

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
});
