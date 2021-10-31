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

			it("should not allow deletion where nothing exists", () =>
				expect(() => crdt.delete(["foo", "bar", "baz"])).to.throw(Error));

			it("should not allow indexing into an object or list incorrectly", () => {
				crdt.assign([], {});
				crdt.assign(["list"], []);
				crdt.insert(["list", 0], 10);

				expect(() => crdt.assign(["list", "0"], 10)).to.throw(Error);
				expect(() => crdt.insert([0], 10)).to.throw(Error);
			});

			it("should enforce a deletion", () => {
				crdt.assign([], {});
				crdt.assign(["list"], []);
				crdt.insert(["list", 0], "element");
				expect(crdt).to.render({list: ["element"]});
				crdt.delete(["list"]);
				expect(crdt).to.render({});
				expect(() => crdt.assign(["list", 0], "new element")).to.throw(Error);
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
				expect(crdtA).to.merge(crdtB).as({foo: 69, bar: 420});
			});

			it("should be able to handle concurrent insertions to different locations", () => {
				crdtA.assign([], []);
				crdtA.insert([0], 2);
				crdtA.insert([1], 4);
				expect(crdtA).to.merge(crdtB).as([2, 4]);

				crdtA.insert([0], 1);
				crdtB.insert([1], 3);

				expect(crdtA).to.be.merge(crdtB).as([1, 2, 3, 4]);
			});

			it("should be able to handle concurrent insertions to the same location", () => {
				crdtA.assign([], []);
				expect(crdtA).to.merge(crdtB).as([]);

				crdtA.insert([0], "foo");
				crdtB.insert([0], "bar");

				expect(crdtA).to.merge(crdtB).asOneOf(["foo", "bar"], ["bar", "foo"]);
			});

			it("should not interleave changes", () => {
				crdtA.assign([], []);
				expect(crdtA).to.merge(crdtB).as([]);

				crdtA.insert([0], "one");
				crdtA.insert([1], "two");
				crdtA.insert([2], "three");
				crdtA.insert([3], "four");

				crdtB.insert([0], 1);
				crdtB.insert([1], 2);
				crdtB.insert([2], 3);
				crdtB.insert([3], 4);

				expect(crdtA).to.merge(crdtB).asOneOf(
					[1, 2, 3, 4, "one", "two", "three", "four"],
					["one", "two", "three", "four", 1, 2, 3, 4]
				);
			});

			it("should resolve moving indices in a list", () => {
				crdtA.assign([], []);
				crdtA.insert([0], "target");
				expect(crdtA).to.merge(crdtB).as(["target"]);

				crdtA.insert([0], "before");
				crdtA.insert([2], "after");
				crdtA.insert([0], "before before");
				crdtB.assign([0], "hit!");
				crdtA.insert([1], "after before, but still before");

				expect(crdtA).to.merge(crdtB).as([
					"before before",
					"before",
					"after before, but still before",
					"hit!",
					"after",
				]);
			});

			describe("concurrent deletion", () => {

				it("should handle concurrent deletions of a map element", () => {
					crdtA.assign(["foo"], "bar");
					expect(crdtA).to.merge(crdtB).as({foo: "bar"});
					crdtA.delete(["foo"]);
					crdtB.delete(["foo"]);
					expect(crdtA).to.merge(crdtB).as({});
				});

				it("should handle concurrent deletions of a list element", () => {
					crdtA.assign([], []);
					crdtA.insert([0], 2);
					crdtA.insert([0], 1);
					expect(crdtA).to.merge(crdtB).as([1, 2]);
					crdtA.delete([0]);
					crdtB.delete([0]);
					expect(crdtA).to.merge(crdtB).as([2]);
				});

				it("should preserve an assignment with a concurrent deletion at the root", () => {
					crdtA.delete([]);
					crdtB.assign([], []);

					expect(crdtA).to.render(undefined);
					expect(crdtB).to.render([]);

					expect(crdtA).to.merge(crdtB).as([]);
				});

				it("should preserve an assignment with a concurrent deletion in an object", () => {
					crdtA.assign(["foo"], "bar");
					expect(crdtA).to.merge(crdtB).as({foo: "bar"});

					crdtA.delete(["foo"]);
					crdtB.assign(["foo"], "baz");

					expect(crdtA).to.render({});
					expect(crdtB).to.render({foo: "baz"});
					expect(crdtA).to.merge(crdtB).as({foo: "baz"});
				});

				it("should preserve an assignment with a concurrent deletion in a list", () => {
					crdtA.assign([], []);
					crdtA.insert([0], "foo");
					expect(crdtA).to.merge(crdtB).as(["foo"]);

					crdtA.delete([0]);
					crdtB.assign([0], "bar");

					expect(crdtA).to.render([]);
					expect(crdtB).to.render(["bar"]);

					expect(crdtA).to.merge(crdtB).as(["bar"]);
				});

				it("should resolve a nested assignment with a concurrent deletion in an object", () => {
					crdtA.assign(["foo"], {});
					crdtA.assign(["foo", "bar"], 1);
					crdtA.assign(["foo", "baz"], 2);
					expect(crdtA).to.merge(crdtB).as({foo: {bar: 1, baz: 2}});

					crdtA.delete(["foo"]);
					crdtB.assign(["foo", "kept"], 3);

					expect(crdtA).to.render({});
					expect(crdtB).to.render({foo: {bar: 1, baz: 2, kept: 3}});
					// expect(crdtA).to.merge(crdtB).as({foo: {kept: 3}}); // paper behaviour
					expect(crdtA).to.merge(crdtB).as({}); // automerge behaviour
				});

				it("should resolve a nested assignment with a concurrent deletion in a list", () => {
					crdtA.assign(["foo"], []);
					crdtA.insert(["foo", 0], {});
					crdtA.assign(["foo", 0, "bar"], 0);
					expect(crdtA).to.merge(crdtB).as({foo: [{bar: 0}]});

					crdtA.delete(["foo", 0]);
					crdtB.assign(["foo", 0, "bar"], 20);

					expect(crdtA).to.render({});
					expect(crdtB).to.render({foo: [{bar: 20}]});
					// expect(crdtA).to.merge(crdtB).as({foo: [{bar: 20}]}); // paper behaviour
					expect(crdtA).to.merge(crdtB).as({}); // automerge behaviour
				});
			});

			// This is a whitebox test I think. Requires understanding of what the transport will look like
			it("should handle an update for a list it hasn't gotten an assignment for yet");

			describe("conflicting assignment", () => {
				it("should be fine if two processes assign the same value to the same variable" , () => {
					crdtA.assign(["foo"], "bar");
					crdtB.assign(["foo"], "bar");
					expect(crdtA).to.merge(crdtB).as({foo: "bar"});
				});

				it("should pick a winner from concurrent assignment at root", () => {
					crdtA.assign([], 10);
					crdtB.assign([], -10);
					expect(crdtA).to.merge(crdtB).asOneOf(10, -10);
				});

				it("should pick a winner from concurrent assignment in an object", () => {
					crdtA.assign(["foo"], 10);
					crdtB.assign(["foo"], -10);
					expect(crdtA).to.merge(crdtB).asOneOf({foo: 10}, {foo: -10});
				});

				it("should pick a winner from concurrent assignment in a list", () => {
					crdtA.assign([], []);
					crdtA.insert([0], 0);
					expect(crdtA).to.merge(crdtB).as([0]);

					crdtA.assign([0], 69);
					crdtB.assign([0], 420);
					expect(crdtA).to.merge(crdtB).asOneOf([69], [420]);
				});

				it("should pick a winner from concurrent assignment in a nested list", () => {
					crdtA.assign(["list"], []);
					crdtA.insert(["list", 0], 0);
					expect(crdtA).to.merge(crdtB).as({list: [0]});

					crdtA.assign(["list", 0], []);
					crdtB.assign(["list", 0], {});
					expect(crdtA).to.merge(crdtB).asOneOf({list: [[]]}, {foo: [{}]});
				});

				it("should pick a winner from concurrent, consecutive changes including assignment", () => {
					crdtA.assign([], []);
					crdtA.insert([0], 0);
					expect(crdtA).to.merge(crdtB).as([0]);

					crdtA.assign([0], {});
					crdtB.assign([0], []);
					crdtA.assign([0, "foo"], "ayy");
					crdtB.insert([0, 0], "lmao");

					expect(crdtA).to.merge(crdtB).asOneOf([{foo: "ayy"}], [["lmao"]]);
				});

				it("should pick a winner from concurrent changes with moving indices", () => {
					crdtA.assign([], []);
					crdtA.insert([0], 0);
					expect(crdtA).to.merge(crdtB).as([0]);

					crdtA.insert([0], 1);
					crdtB.insert([1], 3);
					crdtA.assign([1], 2);
					crdtB.assign([0], "two");

					expect(crdtA).to.merge(crdtB).asOneOf([1, 2, 3], [1, "two", 3]);
				});

				it("should resolve redundant concurrent changes", () => {
					crdtA.assign([], {});
					crdtB.assign([], {});
					crdtA.assign(["foo"], 10);
					crdtB.assign(["bar"], 20);
					expect(crdtA).to.merge(crdtB).as({foo: 10, bar: 20});
				});
			});

			describe("CRD JSON T paper examples", () => {
				it("should handle concurrent assignment (fig.1)", () => {
					crdtA.assign(["key"], "A");
					expect(crdtA).to.merge(crdtB).as({key: "A"});

					crdtA.assign(["key"], "B");
					crdtB.assign(["key"], "C");

					expect(crdtA).to.render({key: "B"});
					expect(crdtB).to.render({key: "C"});
					expect(crdtA).to.merge(crdtB).asOneOf({key: "B"}, {key: "C"});
				});

				it("should resolve concurrent mutation and reassignment (fig.2)", () => {
					crdtA.assign(["colors"], {});
					crdtA.assign(["colors", "blue"], "#0000ff");
					expect(crdtA).to.merge(crdtB).as({colors: {blue: "#0000ff"}});

					crdtA.assign(["colors", "red"], "#ff0000");
					crdtB.assign(["colors"], {});
					crdtB.assign(["colors", "green"], "#00ff00");

					expect(crdtA).to.render({colors: {blue: "#0000ff", red: "#ff0000"}});
					expect(crdtB).to.render({colors: {green: "#00ff00"}});

					expect(crdtA).to.merge(crdtB).as({colors: {red: "#ff0000", green: "#00ff00"}});
				});

				it("should handle replicas creating lists with same key (fig.3)", () => {
					crdtA.assign(["grocery"], []);
					crdtA.insert(["grocery", 0], "eggs");
					crdtA.insert(["grocery", 1], "ham");
					crdtB.assign(["grocery"], []);
					crdtB.insert(["grocery", 0], "milk");
					crdtB.insert(["grocery", 1], "flour");

					expect(crdtA).to.merge(crdtB).asOneOf(
						["eggs", "ham", "milk", "flour"],
						["milk", "flour", "eggs", "ham"],
					);
				});

				it("should resolve concurrent list edits (fig.4)", () => {
					crdtA.assign([], []);
					crdtA.insert([0], "a");
					crdtA.insert([1], "b");
					crdtA.insert([2], "c");
					expect(crdtA).to.merge(crdtB).as(["a", "b", "c"]);

					crdtA.delete([1]);
					expect(crdtA).to.render(["a", "c"]);
					crdtA.insert([1], "x");
					expect(crdtA).to.render(["a", "x", "c"]);

					crdtB.insert([0], "y");
					expect(crdtB).to.render(["y", "a", "b", "c"]);
					crdtB.insert([2], "z");
					expect(crdtB).to.render(["y", "a", "z", "b", "c"]);

					expect(crdtA).to.merge(crdtB).asOneOf(
						["y", "a", "x", "z", "c"],
						["y", "a", "z", "x", "c"],
					);
				});

				it("should handle concurrent key assignment to different types (fig.5)", () => {
					crdtA.assign(["a"], {});
					crdtA.assign(["a", "x"], "y");
					expect(crdtA).to.render({a: {x: "y"}});

					crdtB.assign(["a"], []);
					crdtB.insert(["a", 0], "z");
					expect(crdtB).to.render({a: ["z"]});

					expect(crdtA).to.merge(crdtB).asOneOf({a: {x: "y"}}, {a: ["z"]});
				});

				it("should handle concurrent deletion and update on an element (fig.6)", () => {
					crdtA.assign(["todo"], []);
					crdtA.insert(["todo", 0], {});
					crdtA.assign(["todo", 0, "title"], "buy milk");
					crdtA.assign(["todo", 0, "done"], false);
					expect(crdtA).to.merge(crdtB).as({todo: [{title: "buy milk", done: false}]});

					crdtA.delete(["todo", 0]);
					crdtB.assign(["todo", 0, "done"], true);

					expect(crdtA).to.render({todo: []});
					expect(crdtB).to.render({todo: [{title: "buy milk", done: true}]});

					// expect(crdtA).to.merge(crdtB).as({todo: [{done: true}]}); // paper behaviour
					expect(crdtA).to.merge(crdtB).as({todo: []}); // automerge behaviour
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
