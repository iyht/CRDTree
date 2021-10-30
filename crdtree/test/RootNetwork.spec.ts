import {expect} from "chai";
import {Done} from "mocha";

describe("RootNetwork", () => {
	describe("Socket initialization tests", () => {
		it("should be able to start a server", () => {
			// TODO
		});
		it("should reject invalid addresses", () => {
			// TODO
		});

		it("should be able to connect", () => {
			// TODO can we split testing or do we have to test connect/onConnect together?
		});
	});

	describe("Live operation tests", () => {
		it ("should be able to propagate an outgoing change", () => {
			// TODO
		});

		it ("should be able to receive an incoming change", () => {
			// TODO
		});
	});
});
