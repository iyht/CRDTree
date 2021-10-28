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
		});

		describe("merge", () => {
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
