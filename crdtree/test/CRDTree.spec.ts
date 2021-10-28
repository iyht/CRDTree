import {expect} from "chai";
import {Done} from "mocha";

describe("CRDTree", () => {

	describe("CRDT", () => {

		describe("assign/insert/render", () => {

		});

		// Local operations
		describe("insert", () => {
		});

		describe("delete", () => {
		});

		// Concurrent operations merging testing
		describe("Concurrent local insertion", () => {
			it("should show merge two CRDTs with local insertion, both insertion should be contained in the merged CRDT", (done) => {
				done(); // TODO
			});
		});

		describe("Concurrent local deletion on the same object", () => {
			it("should show merge two CRDTs with local deletion on the same objecl. We should see only one deletion should be performed in the merged CRDT", (done) => {
				done(); // TODO
			});
		});

		// History
		describe("Basic local history record", () => {
			it("should show all the local operations are recorded in the history", (done) => {
				done(); // TODO
			});
		});

		describe("fork => do something on the fork", () => {
			it(" should show fork copy all the history from main. New operation should be continually recorded on the fork's history", (done) => {
				done(); // TODO
			});
		});

		describe("fork => do something on the fork => do something on main", () => {
			it(" should show both main and fork have their own history record. New operation after forking will not affect on history for each other.", (done) => {
				done(); // TODO
			});
		});

		describe("fork => do something on the fork => do something on main => join fork back into main", () => {
			it("should show the main have every history it has before as well as the joined history of fork", (done) => {
				done(); // TODO
			});
		});

		describe("clone", () => {

		});

		describe("onUpdate", () => {
			it("should eventually call onUpdate", (done) => {
				done(); // TODO
			});
		});
	});
});




