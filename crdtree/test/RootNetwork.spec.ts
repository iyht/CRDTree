import {expect} from "chai";
import {Done} from "mocha";
import {RootNetwork} from "../src/RootNetwork";
import {CRDTree, ICRDTree, CRDTreeTransport} from "../src/CRDTree";

describe("RootNetwork", () => {
	describe("Socket initialization tests", () => {
		let rn: RootNetwork;
		beforeEach(() => rn = new RootNetwork(6739));

		it("should reject invalid addresses", () => {
			expect(rn.connect(123, "412.312.159.20")).to.be.false;

		});
		it("should handle failing to connect", () => {
			// connects to a fake, but valid IP address, times out, returns false
			// TODO
			expect(rn.connect(123, "127.0.0.1")).to.be.false;

		});

		it("should be able to connect to another RootNetwork", () => {
			// TODO can we split testing or do we have to test connect/onConnect together?
			let rn2 = new RootNetwork(7902);
			expect(rn2.connect(6739, "127.0.0.1")).to.be.true;
		});
	});

	describe("Live operation tests", () => {
		let rn, rn2: RootNetwork;

		beforeEach(() => {
			rn = new RootNetwork(6739);
			rn2 = new RootNetwork(7902);
			rn2.connect(6739, "127.0.0.1");
		});

		it ("should be able to send and receive a change", () => {
			let send_crdt_trans : CRDTreeTransport<String> = ["branch: 1, op: insert, token: a, index: "]
			let rec_crdt_trans : CRDTreeTransport<String> = {"branch": 1, "op": "insert", "token": "a", "index": ""};


			// TODO
			rn.send()
		});
	});
});
