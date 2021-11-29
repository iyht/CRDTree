import {expect} from "chai";
import {Done} from "mocha";
import {CRDTree} from "../src/CRDTree";
import "./util/utils";
import {ICRDTree} from "../src/API";
import {FrontendPrimitive} from "../src/Primitive";
import {readResource} from "./util/utils";

describe("CRDTree", () => {

	describe("CRDT", () => {

		describe("assign/insert/delete/render", () => {
			let crdt: ICRDTree;

			beforeEach(() => crdt = new CRDTree());

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
						crdt.assign([], data as FrontendPrimitive);
					}).to.throw(Error);
					expect(() => {
						crdt.assign([], []);
						crdt.insert([0], data as FrontendPrimitive);
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

			it("should be able to assign to sub-objects (just objects)", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], {});
				crdt.assign(["foo", "bar"], {});
				crdt.assign(["foo", "bar", "baz"], "change");
				expect(crdt).to.render({foo: {bar: {baz: "change"}}});
			});

			it("should be able to delete a sub-object", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], {});
				crdt.assign(["foo", "bar"], {});
				crdt.assign(["foo", "bar", "baz"], "change");
				crdt.delete(["foo", "bar"]);
				expect(crdt).to.render({foo: {}});
			});

			it("should be able to assign to sub-objects (just arrays)", () => {
				crdt.assign([], []);
				crdt.insert([0], []);
				crdt.insert([0, 0], []);
				crdt.insert([0, 0, 0], "foo");
				expect(crdt).to.render([[["foo"]]]);
			});

			it("should be able to assign to sub-objects (mixed)", () => {
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
				crdt.assign(["foo"], []);
				crdt.insert(["foo", 0], 10);
				expect(crdt).to.render({foo: [10]});
				crdt.delete(["foo", 0]);
				expect(crdt).to.render({foo: []});
				crdt.delete(["foo"]);
				expect(crdt).to.render({});
				crdt.delete([]);
				expect(crdt).to.render(undefined);
			});

			it("should support insertion",() => {
				crdt.assign([], []);
				crdt.insert([0], 0);
				crdt.insert([1], 1);
				crdt.insert([2], 2);
				crdt.insert([3], 3);
				crdt.insert([4], 4);
				crdt.insert([5], 5);
				expect(crdt).to.render([0, 1, 2, 3, 4, 5]);
			});

			it("should support insertion (out of order)", () => {
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
				expect(() => crdt.assign([0], 10)).to.throw(Error);
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

			it("should be able to mutate objects within a list", () => {
				crdt.assign([], []);
				crdt.insert([0], 0);
				crdt.assign([0], {});
				expect(crdt).to.render([{}]);
				crdt.assign([0, "foo"], "ayy");
				expect(crdt).to.render([{foo: "ayy"}]);
			});

			xit("should not allow complex object assignment", () => {
				// type system to the rescue?
				// expect(() => crdt.assign([], {foo: 69})).to.throw(Error);
				// expect(() => crdt.assign([], [420])).to.throw(Error);
			});

			describe("cloning", () => {
				it("should be possible to clone a crdt", () => {
					crdt.assign([], {});
					crdt.assign(["bar"], {});
					const newCrdt = new CRDTree(crdt.serialize());
					expect(newCrdt).to.render({bar: {}});
				});
			});
		});

		describe("merge", () => {
			let crdtA: ICRDTree;
			let crdtB: ICRDTree;

			beforeEach(() => {
				crdtA = new CRDTree([], "A");
				crdtA.assign([], {});
				crdtB = new CRDTree(crdtA.serialize(), "B");
			});

			it("should be able to merge into self as a no-op", () => {
				crdtA.merge(crdtA);
				expect(crdtA).to.render({});
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
				crdtA.insert([1], "after after");
				expect(crdtA).to.merge(crdtB).as(["target", "after after"]);

				crdtA.insert([0], "before");
				crdtA.insert([2], "after");
				crdtA.insert([0], "before before");
				crdtB.assign([0], "hit!");
				crdtA.insert([2], "after before, but still before");

				expect(crdtA).to.render([
					"before before",
					"before",
					"after before, but still before",
					"target",
					"after",
					"after after",
				]);

				expect(crdtB).to.render([
					"hit!",
					"after after",
				]);

				expect(crdtA).to.merge(crdtB).as([
					"before before",
					"before",
					"after before, but still before",
					"hit!",
					"after",
					"after after",
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

					crdtA.delete(["foo"]);
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
				it("should be fine if two processes assign the same value to the same variable", () => {
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
					expect(crdtA).to.merge(crdtB).asOneOf({list: [[]]}, {list: [{}]});
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

				xit("should resolve redundant concurrent changes", () => {
					crdtA.assign([], {});
					crdtB.assign([], {});
					crdtA.assign(["foo"], 10);
					crdtB.assign(["bar"], 20);
					expect(crdtA).to.merge(crdtB).as({foo: 10, bar: 20});
				});
			});

			describe("Message loss/Out of order delivery", () => {

				it("should render once everything is delivered even if out of order", async () => {
					const updates = [];
					crdtA.onUpdate((update) => updates.push(...update));
					crdtA.assign(["foo"], {});
					crdtA.assign(["foo", "foo"], "bar");
					// enforce that callback gets executed
					await new Promise((resolve) => setImmediate(resolve));
					expect(crdtA).to.render({foo: {foo: "bar"}});
					expect(crdtB).to.render({});
					expect(updates).to.have.length(2);
					crdtB.merge([updates.pop()]);
					crdtB.merge([updates.pop()]);
					expect(crdtB).to.render({foo: {foo: "bar"}});
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

				xit("should resolve concurrent mutation and reassignment (fig.2)", () => {
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

				xit("should handle replicas creating lists with same key (fig.3)", () => {
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

					expect(crdtA).to.merge(crdtB).as({todo: []});
				});
			});
		});

		describe("onUpdate", () => {
			it("should eventually call onUpdate", (done: Done) => {
				const crdt: ICRDTree = new CRDTree();
				crdt.onUpdate((update) => {
					expect(update).to.exist;
					done();
				});
				crdt.assign([], "foo");
			});
		});

		xdescribe("stress test", () => {
			const text = readResource("text.txt");
			const characters = text.split("");
			const reversedCharacters = characters.slice().reverse();

			const insertReversedCharsAt = (tree: CRDTree, at: number) =>
				reversedCharacters.forEach((char) =>
					tree.insert([at], char));

			const insertInOrderCharsAt = (tree: CRDTree, at: number) =>
				characters.forEach((char, index) =>
					tree.insert([index + at], char));

			it(`should perform reasonably with many insertions ((2 * ${characters.length}) + 1)`, function () {
				this.timeout(1000);
				const crdtA = new CRDTree([], "A");
				crdtA.assign([], []);
				crdtA.insert([0], "@");
				const crdtB = new CRDTree(crdtA.serialize(), "B");

				insertReversedCharsAt(crdtA, 0);
				insertInOrderCharsAt(crdtB, 1);

				expect(crdtA).to.merge(crdtB);
				expect(crdtA.render().join("")).to.equal(`${text}@${text}`);
			});
		});
	});

	describe("CRDTree", () => {

		describe("fork and join", () => {
			let tree: ICRDTree;

			beforeEach(() => tree = new CRDTree());

			it("should have a ref for the default branch", () =>
				expect(tree.ref()).to.exist);

			it("should always use the same default ref", () => {
				expect(new CRDTree()).to.be.on(tree.ref());
			});

			it("should be able to fork", () => {
				const ref = tree.fork();
				expect(ref).to.exist;
				expect(tree).to.be.on(ref);
			});

			it("should be able to fork multiple times", () => {
				const forkA = tree.fork();
				const forkB = tree.fork();
				expect(tree).to.be.on(forkB);
				expect(forkA).to.not.equal(forkB);
			});

			it("should be able to fork multiple times from the same place in time", () => {
				const main = tree.ref();
				tree.assign([], []);
				const forkA = tree.fork();
				tree.insert([0], 1);
				tree.checkout(main);
				const forkB = tree.fork();
				tree.insert([0], 2);
				expect(tree).to.be.on(forkB);
				expect(forkA).to.not.equal(forkB);
				tree.checkout(main);
				tree.join(forkA);
				tree.join(forkB);
				expect(tree).asOneOf([1, 2], [2, 1]);
			});

			it("should preserve changes from before the fork", () => {
				tree.assign([], "change");
				tree.fork();
				expect(tree).to.render("change");
			});

			it("should be able to check out an existing branch using a ref", () => {
				const main = tree.ref();
				tree.assign([], {});
				expect(tree).to.render({});
				const feature = tree.fork();
				expect(tree).to.render({});
				tree.assign(["foo"], "change");
				expect(tree).to.render({foo: "change"});
				tree.checkout(main);
				expect(tree).to.render({});
				tree.checkout(feature);
				expect(tree).to.render({foo: "change"});
			});

			it("should be able to join a branch back into the default branch", () => {
				const main = tree.ref();
				tree.assign([], {});
				const feature = tree.fork();
				tree.assign(["foo"], "change");
				tree.checkout(main);
				expect(tree).to.render({});
				tree.join(feature);
				expect(tree).to.render({foo: "change"});
			});

			it("should be able to join a branch to a different branch", () => {
				const main = tree.ref();
				tree.assign([], {});
				const featureA = tree.fork();
				tree.checkout(main);
				const featureB = tree.fork();
				tree.checkout(featureA);
				tree.assign(["foo"], "change");
				expect(tree).to.render({foo: "change"});
				tree.checkout(featureB);
				expect(tree).to.render({});
				tree.join(featureA);
				expect(tree).to.render({foo: "change"});
				tree.checkout(main);
				expect(tree).to.render({});
			});

			it("should be able to continue committing to a branch which has been joined", () => {
				const main = tree.ref();
				tree.assign([], {});
				const feature = tree.fork();
				tree.assign(["foo"], "change");
				tree.checkout(main);
				tree.join(feature);
				expect(tree).to.render({foo: "change"});
				tree.checkout(feature);
				tree.assign(["bar"], "other-change");
				expect(tree).to.render({foo: "change", bar: "other-change"});
				tree.checkout(main);
				expect(tree).to.render({foo: "change"});
			});

			it("should support checking out a branch that you're already on", () => {
				const main = tree.ref();
				expect(tree).to.be.on(main);
				tree.checkout(main);
				expect(tree).to.be.on(main);

				const feature = tree.fork();
				expect(tree).to.be.on(feature);
				tree.checkout(feature);
				expect(tree).to.be.on(feature);
			});

			it("should support joining into the same branch", () => {
				const main = tree.ref();
				tree.assign([], {});
				const feature = tree.fork();
				tree.assign(["foo"], "bar");
				expect(tree).to.render({foo: "bar"});
				expect(tree).to.be.on(feature);
				tree.join(feature);
				expect(tree).to.render({foo: "bar"});
				tree.checkout(main);
				expect(tree).to.render({});
			});
		});

		describe("async collaboration", () => {
			let treeA: ICRDTree;
			let treeB: ICRDTree;

			beforeEach(() => {
				treeA = new CRDTree();
				treeA.assign([], {});
				treeB = new CRDTree(treeA.serialize());
			});

			it("should list fork created on another node", () => {
				const main = treeA.ref();
				const fork = treeA.fork();
				treeB.merge(treeA);
				expect(treeB.listRefs()).to.include(fork);
				expect(treeA).to.be.on(fork);
				expect(treeB).to.be.on(main);
			});

			it("should keep same merging behaviour even when on another branch", () => {
				const feature = treeA.fork();
				treeB.merge(treeA);
				treeA.merge(treeB);
				treeB.checkout(feature);

				treeA.assign(["foo"], "foo");
				treeB.assign(["bar"], "bar");

				expect(treeA).to.render({foo: "foo"});
				expect(treeB).to.render({bar: "bar"});
				expect(treeA).to.merge(treeB).as({foo: "foo", bar: "bar"});
			});

			it("should not render changes on a branch when on other branches", () => {
				treeA.fork();
				treeA.assign(["foo"], "change");
				treeB.merge(treeA);
				treeA.merge(treeB);
				expect(treeA).to.render({foo: "change"});
				expect(treeB).to.render({});

			});

			it("should be able to checkout a branch made on another replica", () => {
				const feature = treeA.fork();
				treeA.assign(["foo"], "change");
				treeB.merge(treeA);
				treeA.merge(treeB);
				treeB.checkout(feature);
				expect(treeB).to.render({foo: "change"});
			});

			it("should use the default state if checking out a branch it doesn't know about yet", () => {
				const feature = treeA.fork();
				treeB.checkout(feature);
				expect(treeB).to.render(undefined);
				expect(treeA).to.merge(treeB).as({});
			});

			describe("Message loss/Out of order delivery for forks and joins", () => {

				it("should render branches properly once everything is delivered even if out of order", async () => {
					const updates = [];
					treeA.onUpdate((update) => updates.push(...update));
					const fork = treeA.fork();
					treeA.assign(["foo"], {});
					treeA.assign(["foo", "foo"], "bar");
					// enforce that callback gets executed
					await new Promise((resolve) => setImmediate(resolve));
					expect(treeA).to.render({foo: {foo: "bar"}});
					expect(treeB).to.render({});

					expect(updates).to.have.length(4);

					treeB.merge([updates.pop()]);
					treeB.merge([updates.pop()]);
					treeB.merge([updates.pop()]);
					treeB.merge([updates.pop()]);

					expect(treeB.listRefs()).to.include(fork);
					expect(treeB).to.render({});
					treeB.checkout(fork);
					expect(treeB).to.render({foo: {foo: "bar"}});
				});
			});
		});
	});
});
