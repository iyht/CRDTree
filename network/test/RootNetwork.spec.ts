import {expect} from "chai";
import {CRDTree, ICRDTree} from "crdtree";
import {RootNetwork} from "../src/RootNetwork";

describe("RootNetwork", () => {
	describe("Serialize/Deserialize tests", () => {
		let rn: RootNetwork;
		let crdtA: ICRDTree;
		let crdtB: ICRDTree;
		beforeEach(() => {
			rn = new RootNetwork();
			crdtA = new CRDTree([], "A");
			crdtA.assign([], {});
			crdtB = new CRDTree(crdtA.serialize(), "B");
		});
		it("should be able to serialize, deserialize, and merge the empty changes", () => {
			crdtA.assign([], []);
			let msg: string = rn.encode(crdtA);
			crdtB.merge(rn.decode(msg));
			expect(crdtB.render()).to.deep.equal([]);
		});
		it("should be able to serialize, deserialize, and merge concurrent assignment to different vars", () => {
			crdtA.assign(["foo"], 69);
			crdtB.assign(["bar"], 420);
			let msg: string = rn.encode(crdtB);
			crdtA.merge(rn.decode(msg));
			expect(crdtA.render()).to.deep.equal({foo: 69, bar: 420});
		});
		it("should be able to serialize, deserialize, and merge concurrent insertion to the same location", () => {

			crdtA.assign([], []);
			crdtA.merge(crdtB);
			crdtB.merge(crdtA);
			expect(crdtA.render()).deep.equal([]);

			crdtA.insert([0], "foo");
			crdtB.insert([0], "bar");
			let msg: string = rn.encode(crdtB);
			crdtA.merge(rn.decode(msg));
			expect([["foo", "bar"], ["bar", "foo"]]).to.deep.include(crdtA.render());
		});

		it("should be able to serialize, deserialize, and merge interleave change", () => {
			crdtA.assign([], []);
			crdtA.merge(crdtB);
			crdtB.merge(crdtA);
			expect(crdtA.render()).deep.equal([]);

			crdtA.insert([0], "one");
			crdtA.insert([1], "two");
			crdtA.insert([2], "three");
			crdtA.insert([3], "four");

			crdtB.insert([0], 1);
			crdtB.insert([1], 2);
			crdtB.insert([2], 3);
			crdtB.insert([3], 4);
			let msg: string = rn.encode(crdtB);
			crdtA.merge(rn.decode(msg));

			expect([
				[1, 2, 3, 4, "one", "two", "three", "four"],
				["one", "two", "three", "four", 1, 2, 3, 4]
			]).to.deep.include(crdtA.render());
		});


		// it("should reject invalid addresses", () => {
		// 	expect(rn.connect([123, "412.312.159.20"])).to.be.false;

		// });
		// 	it("should handle failing to connect", () => {
		// 		// connects to a fake, but valid IP address, times out, returns false
		// 		// TODO
		// 		expect(rn.connect([123, "127.0.0.1"])).to.be.false;

		// 	});

		// 	it("should be able to send even if no others are connected", () => {
		// 		try {
		// 			let trans: Operation = {branch: "1", clock: 1, op: "insert", data: "data", index: "0"};
		// 			let send_crdt_trans: CRDTreeTransport<String[]> = [trans];
		// 			rn.send(send_crdt_trans);
		// 		} catch {
		// 			expect.fail();
		// 		}
		// 	})

		// 	it("should be able to connect to another RootNetwork", () => {
		// 		// TODO can we split testing or do we have to test connect/onConnect together?
		// 		let rn2 = new RootNetwork(7902);
		// 		expect(rn2.connect([6739, "127.0.0.1"])).to.be.true;
		// 	});

		// 	it("should be able to connect to RootNetwork, then implicitly connect to other nodes on the network", () => {
		// 		let rn3 = new RootNetwork(8912);
		// 		expect(rn3.connect([6739, "127.0.0.1"])).to.be.true;
		// 	});
		// });

		// describe("Live operation tests", () => {
		// 	let rn, rn2: RootNetwork;
		// 	let trans: Operation = {branch: "1", clock: 1, op: "insert", data: "data", index: "0"};
		// 	let send_crdt_trans: CRDTreeTransport<String[]> = [trans];

		// 	beforeEach(() => {
		// 		rn = new RootNetwork(6739);
		// 		rn2 = new RootNetwork(7902);
		// 		rn2.connect([6739, "127.0.0.1"]);
		// 	});

		// 	it("should be able to send and receive a change between two nodes", () => {

		// 		// TODO handle receive
		// 		rn.send(send_crdt_trans);
		// 		expect(rn2.tmp_trans).to.equal(trans);

		// 	});

		// 	it("should be able to send and receive a change between three nodes", () => {
		// 		let rn3 = new RootNetwork(8912);
		// 		rn3.connect([6739, "127.0.0.1"]);

		// 		rn.send(send_crdt_trans);
		// 		expect(rn2.tmp_trans).to.equal(trans);
		// 		expect(rn3.tmp_trans).to.equal(trans);
		// 	});

		// 	it("should be able to send and receive a change between nodes", () => {
		// 		let rn3 = new RootNetwork(8912);
		// 		rn3.connect([6739, "127.0.0.1"]);

		// 		rn2.send(send_crdt_trans);
		// 		expect(rn.tmp_trans).to.equal(trans);
		// 		expect(rn3.tmp_trans).to.equal(trans);
		// 	});


		// TODO this test case: network partitions
		// it ("should send messages successfully even " () => {

		// // 1 connects to 2 and 3, sends successfully to 2, 3 suffers a network partition, reconnects, and receives those changes

		// });
	});
});

