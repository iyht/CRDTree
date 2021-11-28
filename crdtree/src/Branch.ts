import {Change, changeLt} from "./Change";
import {BranchID} from "./API";

type BranchMap = Map<BranchID, Map<BranchID, Change>>;  // TODO populate this before call
const checkCausallyRelevant = (change: Change, branch: BranchID, map: BranchMap): boolean => {
	if (change.branch == branch) return true;
	Array.from(map.get(branch)).map(([predecessorID, lastRelevantChange]) => {
		return checkCausallyRelevantParents(change, predecessorID, lastRelevantChange, map)
	}).reduce((b1, b2) => {return b1 || b2}, false)
}

const checkCausallyRelevantParents = (change: Change, branch: BranchID, lastRelevantChange: Change, map: BranchMap): boolean => {
	if (change == lastRelevantChange) return true;
	if (change.branch == branch) return changeLt(change, lastRelevantChange);
	Array.from(map.get(branch)).map(([predecessorID, lastRelevantChange]) => {
		return checkCausallyRelevantParents(change, predecessorID, lastRelevantChange, map)
	}).reduce((b1, b2) => {return b1 || b2}, false)
}

export {checkCausallyRelevant, BranchMap}
