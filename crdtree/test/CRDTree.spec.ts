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
				expect(crdt).to.render(undefined));

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

			it("should only allow JSON serializable data", () => {
				[undefined, (x) => x(x), NaN].forEach((data: unknown) => {
					expect(() => {
						crdt.assign([], data);
					}).to.throw(Error);
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
				expect(crdt).to.render(undefined);
			});

			it("should support repeated assignment", () => {
				crdt.assign([], 10);
				crdt.assign([], 10);
				crdt.assign([], 10);
				expect(crdt).to.render(10);
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

			it("should be able to replace a sub-object with a primitive", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], {});
				crdt.assign(["foo", "bar"], {});
				expect(crdt).to.render({foo: {bar: {}}});
				crdt.assign(["foo"], 10);
				expect(crdt).to.render({foo: 10});
			});

			it("should support deletion", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], {});
				crdt.insert(["foo", 0], 10);
				expect(crdt).to.render({foo: [10]});
				crdt.delete(["foo", 0]);
				expect(crdt).to.render({foo: []});
				crdt.delete(["foo"]);
				expect(crdt).to.render({});
				crdt.delete([]);
				expect(crdt).to.render(undefined);
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

			it("should not let a noop affect state", () => {
				crdt.assign([], {});
				crdt.noop();
				expect(crdt).to.render({});
			});

			it("should not allow assignment where nothing exists", () => {
				crdt.assign([], {});
				crdt.assign(["list"], []);

				expect(() => crdt.assign(["list", 0], 10)).to.throw(Error);
				expect(() => crdt.assign(["object", "key"], 10)).to.throw(Error);
			});

			it("should not allow insertion where nothing exists", () => {
				crdt.assign([], {});
				crdt.assign(["list"], []);

				expect(() => crdt.insert(["otherList", 0], 10)).to.throw(Error);
				expect(() => crdt.insert(["list", 1], 10)).to.throw(Error);
			});

			it("should not allow indexing into an object or list incorrectly", () => {
				crdt.assign([], {});
				crdt.assign(["list"], []);
				crdt.insert(["list", 0], 10);

				expect(() => crdt.assign(["list", "0"], 10)).to.throw(Error);
				expect(() => crdt.insert([0], 10)).to.throw(Error);
			});

			xit("should not allow complex object assignment", () => {
				expect(() => crdt.assign([], {foo: 69})).to.throw(Error);
				expect(() => crdt.assign([], [420])).to.throw(Error);
			});
		});

		describe("clone", () => {
			it("should be possible to clone a crdt", () => {
				crdt.assign([], {});
				crdt.assign(["bar"], {});
				const newCrdt = new CRDTree(crdt.serialize());
				expect(newCrdt).to.render({bar: {}});
			});
		});

		describe("merge", () => {
			let crdtA: ICRDTree;
			let crdtB: ICRDTree;

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

				expect(crdtA).to.merge(crdtB).asOneOf(["foo", "bar"], ["bar", "foo"]);
			});

			// This is a whitebox test I think. Requires understanding of what the transport will look like
			it("should handle an update for a list it hasn't gotten an assignment for yet");

			describe("conflicting assignment", () => {
				it("should be fine if two processes assign the same value to the same variable" , () => {
					crdtA.assign(["foo"], "bar");
					crdtB.assign(["foo"], "bar");
					expect(crdtA).to.merge(crdtB).as({foo: "bar"});
				});

				it("should pick a winner from concurrent assignment of different primitive values", () => {
					crdtA.assign(["foo"], 10);
					crdtB.assign(["foo"], -10);
					expect(crdtA).to.merge(crdtB).asOneOf({foo: 10}, {foo: -10});
				});

				it("should pick a winner from concurrent assignment in a list", () => {
					crdtA.assign([], []);
					crdtA.insert([0], 0);
					crdtB = new CRDTree(crdtA.serialize());
					crdtA.assign([0], 69);
					crdtB.assign([0], 420);
					expect(crdtA).to.merge(crdtB).asOneOf(69, 420);
				});

				it("should discard more than a single concurrent change", () => {
					crdtA.assign([], {});
					crdtB.assign([], {});
					crdtA.assign(["foo"], 10);
					crdtB.assign(["bar"], 20);
					expect(crdtA).to.merge(crdtB).asOneOf({foo: 10}, {bar: 20});
				});
			});
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
