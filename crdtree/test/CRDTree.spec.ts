import {expect} from "chai";
import {Done} from "mocha";
import {CRDTree, ICRDTree} from "../src/CRDTree";
import "./util/utils";

describe("CRDTree", () => {

	describe("CRDT", () => {
		let crdt: ICRDTree;

		beforeEach(() => crdt = new CRDTree());

		describe("assign/insert/render", () => {
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

			it("should be able to assign to sub-objects", () => {
				crdt.assign([], {});
				crdt.assign(["foo"], []);
				crdt.insert(["foo", -1], 10);
				expect(crdt).to.render({foo: [10]});
				crdt.assign(["foo", 0], 40);
				expect(crdt).to.render({foo: [40]});
			});

			it("should support insertion", () => {
				crdt.assign([], []);
				crdt.insert([-1], 1);
				crdt.insert([0], 2);
				crdt.insert([1], 3);
				crdt.insert([-1], 4);
				crdt.insert([1], 5);
				expect(crdt).to.render([4, 1, 5, 2, 3]);
			});
		});

		describe("merge", () => {
			// This is a whitebox test I think. Requires understanding of what the transport will look like
			it("should handle an update for a list it hasn't gotten an assignment for yet");
		});

		describe("clone", () => {
			it("should be possible to clone a crdt");
		});

		describe("onUpdate", () => {
			it("should eventually call onUpdate", (done: Done) => {
				done(); // TODO
			});
		});
	});
});
