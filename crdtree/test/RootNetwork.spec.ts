import {expect} from "chai";
import {Done} from "mocha";
import {RootNetwork} from "../src/RootNetwork";
import {CRDTree, ICRDTree, CRDTreeTransport, Operation} from "../src/CRDTree";
import { waitForDebugger } from "inspector";

describe("RootNetwork", () => {
	describe("Socket initialization tests", () => {
		let rn: RootNetwork;
		beforeEach(() => rn = new RootNetwork(6739));

		it("should reject invalid addresses", () => {
			expect(rn.connect([123, "412.312.159.20"])).to.be.false;

		});
		it("should handle failing to connect", () => {
			// connects to a fake, but valid IP address, times out, returns false
			// TODO
			expect(rn.connect([123, "127.0.0.1"])).to.be.false;

		});

		it("should be able to connect to another RootNetwork", () => {
			// TODO can we split testing or do we have to test connect/onConnect together?
			let rn2 = new RootNetwork(7902);
			expect(rn2.connect([6739, "127.0.0.1"])).to.be.true;
		});

		it("should be able to connect to RootNetwork, then implicitly connect to other nodes on the network", () => {
			let rn3 = new RootNetwork(8912);
			expect(rn3.connect([6739, "127.0.0.1"])).to.be.true;
		});
	});

	describe("Live operation tests", () => {
		let rn, rn2: RootNetwork;
		let trans: Operation = {branch: "1", clock: 1, op: "insert", data: "data", index: "0"};
		let send_crdt_trans : CRDTreeTransport<String[]> = [trans];

		beforeEach(() => {
			rn = new RootNetwork(6739);
			rn2 = new RootNetwork(7902);
			rn2.connect([6739, "127.0.0.1"]);
		});

		it ("should be able to send and receive a change between two nodes", () => {

			// TODO handle receive
			rn.send(send_crdt_trans);
			expect(rn2.tmp_trans).to.equal(trans);

		});

		it ("should be able to send and receive a change between three nodes", () => {
			let rn3 = new RootNetwork(8912);
			rn3.connect([6739, "127.0.0.1"]);

			rn.send(send_crdt_trans);
			expect(rn2.tmp_trans).to.equal(trans);
			expect(rn3.tmp_trans).to.equal(trans);
		});
		
		it ("should be able to send and receive a change between nodes", () => {
			let rn3 = new RootNetwork(8912);
			rn3.connect([6739, "127.0.0.1"]);

			rn2.send(send_crdt_trans);
			expect(rn.tmp_trans).to.equal(trans);
			expect(rn3.tmp_trans).to.equal(trans);
		});

		
		// TODO this test case: network partitions
		// it ("should send messages successfully even " () => {

		// // 1 connects to 2 and 3, sends successfully to 2, 3 suffers a network partition, reconnects, and receives those changes

		// });
	});
});
