import {ICRDTree} from "../../src/CRDTree";
import * as chai from "chai";

chai.Assertion.addMethod('render', function (expectedRender) {
	const crdt: ICRDTree = this._obj;
	new chai.Assertion(crdt.render()).to.deep.equal(expectedRender);
});

chai.Assertion.addMethod('renderEqual', function (remote: ICRDTree) {
	const crdt: ICRDTree = this._obj;
	new chai.Assertion(crdt.render()).to.deep.equal(remote.render());
});

chai.Assertion.addMethod('merge', function (remote: ICRDTree) {
	const crdtA: ICRDTree = this._obj;
	const crdtB: ICRDTree = remote;
	crdtB.merge(crdtA);
	crdtA.merge(crdtB);
	new chai.Assertion(crdtA).to.renderEqual(crdtB);
});

chai.Assertion.addMethod('as', function (expectedRender) {
	new chai.Assertion(this._obj).render(expectedRender);
});

chai.Assertion.addMethod('asOneOf', function (expectedRenderA, expectedRenderB) {
	new chai.Assertion([expectedRenderA, expectedRenderB], "No valid render").to.deep.include(this._obj);
});

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	export namespace Chai {
		interface Assertion {
			render(val: any): Assertion;
			renderEqual(remote: ICRDTree): Assertion;
			merge(remote: ICRDTree): Assertion;
			as(val: any): Assertion;
			asOneOf(valA: any, valB: any): Assertion;
		}
	}
}
