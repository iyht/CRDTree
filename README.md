# CPSC538B-Project

## Milestone 1
Requirements for Milestone 1 include:
- **FR1**: Should have a command line invokable test suite
   - Can be invoked via `yarn test` 
- **FR2**: Should have signature and stubs for the high level API
   - Can be seen in the files [here](./crdtree/src). These files include the high level interfaces we designed during the development period of this Milestone.
- **NFR1**: Should have a comprehensive test suite for CRDT as well as the CRDTree extension
   - Can be seen in the test suite written [here](./crdtree/test/CRDTree.spec.ts). Each test is annotated with the behaviour it attempts to expose.
   - Some test cases were taken directly from [Kleppmann et al.](https://arxiv.org/abs/1608.03960) (and are labelled as such). This means we expect our implementation to at least match their specification of correctness.
- **NRF2**: Should have a partial test suite for the CRDTree Protocol Library
   - Can be seen in the starter test suite written [here](./crdtree/test/RootNetwork.spec.ts). While less complete, it had us reason about how the API should be useable.

### Development
#### Requirements
- [Node](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)

To run the tests
1. `yarn install` to gather dependencies
2. `yarn test` to invoke the tests
