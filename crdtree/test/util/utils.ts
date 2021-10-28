import {ICRDTree} from "../../src/CRDTree";

chai.Assertion.addMethod('render', function(expectedRender) {
	const crdt: ICRDTree = this._obj;
	const render = crdt.render();
	new chai.Assertion(render).to.deep.equal(expectedRender);
});

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	export namespace Chai {
		interface Assertion {
			render(expectedRender: any): Assertion;
		}
	}
}
