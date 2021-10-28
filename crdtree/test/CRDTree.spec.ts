import {expect} from "chai";
import {Done} from "mocha";
import {CRDTree, ICRDTree} from "../src/CRDTree";
import "./util/utils";

describe("CRDTree", () => {

	describe("CRDT", () => {
		let crdt: ICRDTree;

		beforeEach(() => crdt = new CRDTree());

		describe("assign/insert/delete/render", () => {
			it("should be able to render a new crdt", () =>
				expect(crdt).to.render(null));

			it("should be able to assign a primitive", () => {
				crdt.assign([], true);
				expect(crdt).to.render(true);
			});

			it("should be able to reassign a primitive", () => {
				[false, 10, "foo", null].forEach((primitive) => {
					crdt.assign([], primitive);
					expect(crdt).to.render(primitive);
				});
			});

			it("should be able to assign an array", () => {
				crdt.assign([], []);
				expect(crdt).to.render([]);
			});

			it("should be able to assign an object", () => {
				crdt.assign([], {});
				expect(crdt).to.render({});
			});

			it("should be able to delete", () => {
				crdt.assign([], {});
				crdt.delete([]);
				expect(crdt).to.render(null);
			});

			it("should be able to assign to sub-objects", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], []);
				crdt.insert(["foo", 0], 10);
				expect(crdt).to.render({foo: [10]});
				crdt.assign(["foo", 0], 40);
				expect(crdt).to.render({foo: [40]});
				crdt.delete(["foo", 0]);
				expect(crdt).to.render({foo: []});
			});

			it("should support insertion", () => {
				crdt.assign([], []);
				crdt.insert([0], 1);
				crdt.insert([1], 2);
				crdt.insert([2], 3);
				crdt.insert([0], 4);
				crdt.insert([2], 5);
				expect(crdt).to.render([4, 1, 5, 2, 3]);
			});

			it("should not allow complex object assignment", () => {
				expect(() => crdt.assign([], {foo: 69})).to.throw;
				expect(() => crdt.assign([], [420])).to.throw;
			});

			it("should not allow complex object insertion");
		});

		describe("clone", () => {
			it("should be possible to clone a crdt");
		});

		describe("merge", () => {
			let crdtA: CRDTree;
			let crdtB: CRDTree;

			beforeEach(() => {
				crdtA = new CRDTree();
				crdtA.assign([], {});
				crdtB = new CRDTree(crdtA.serialize());
			});

			it("should be able to merge in remote changes", () => {
				crdtA.assign([], []);
				crdtB.merge(crdtA);
				expect(crdtB).to.render([]);
			});

			it("should be able to handle concurrent assignment to different vars", () => {
				crdtA.assign(["foo"], 69);
				crdtB.assign(["bar"], 420);
				crdtA.merge(crdtB);
				expect(crdtA).to.render({foo: 69, bar: 420});
			});

			it("should be able to handle concurrent insertions to different locations", () => {
				crdtA.assign([], []);
				crdt.insert([0], 2);
				crdtB.merge(crdtA);

				crdtA.insert([0], 1);
				crdtB.insert([1], 3);

				expect(crdtA).to.be.merge(crdtB).as([1, 2, 3]);
			});

			it("should be able to handle concurrent insertions to the same location", () => {
				crdtA.assign([], []);
				crdtB.merge(crdtA);

				crdtA.insert([0], "foo");
				crdtB.insert([0], "bar");

				expect(crdtA).to.merge(crdtB);
				// TODO make a stronger assertion with total-ordering
				expect(crdtA.render()).to.have.deep.members(["foo", "bar"]);
			});

			// This is a whitebox test I think. Requires understanding of what the transport will look like
			it("should handle an update for a list it hasn't gotten an assignment for yet");

			describe("conflicting assignment");
		});

		describe("onUpdate", () => {
			it("should eventually call onUpdate", (done: Done) => {
				const crdt: ICRDTree = new CRDTree();
				crdt.onUpdate((update) => {
					expect(update).to.exist; // TODO need more information than this
					done();
				});
				crdt.assign([], "foo");
			});
		});
	});
});
