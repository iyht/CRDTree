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

## Milestone 2
Requirements for Milestone 2 include:
- **FR1**: Should be able to initialize a CRDT
  - Can be seen by invoking our test suite via `yarn test` 
- **FR2**: Should be able to merge two CRDTs ~~given their initial states are the same~~
  - We now enforce that every instance has the same initial state, so any two CRDT objects are mergeable. This can also be seen via our test suite 
- **FR3**: Should be able to render a CRDTree
  - Can be seen by invoking our test suite via `yarn test`
- **NFR1**: Merges should terminate in a reasonable amount of time, less than a second
  - NOT YET DEMONSTRATED
- **NFR2**: Memory allocation should scale at worst polynomially in operations
  - This test was born out of some scary things we saw in the original algorithm by [Kleppmann et al.](https://arxiv.org/abs/1608.03960), although by keeping our semantics simple we were able to do away with some of their requirements and maintained linear memory usage. You would need to read the code to see this :(  

## Development
### Requirements
- [Node](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)

To run the tests
1. `yarn install` to gather dependencies
2. `yarn test` to invoke the tests
