import {Change, toID} from "./Change";
import {BranchID, ID} from "./API";
import {nameLt} from "./Clock";

type BranchMap = Map<BranchID, Map<BranchID, ID>>;
const checkCausallyRelevant = (change: Change, branch: BranchID, map: BranchMap): boolean => {
	if (change.branch == branch) return true;
	if (map.get(branch) == undefined) return false;
	return Array.from(map.get(branch)).map(([predecessorID, causalBoundary]) => {
		return checkCausallyRelevantParents(change, predecessorID, causalBoundary, map, new Set(map.keys()))
	}).reduce((b1, b2) => {return b1 || b2}, false)
}

const checkCausallyRelevantParents = (change: Change, branch: BranchID, causalBoundary: ID, map: BranchMap, visited: Set<BranchID>): boolean => {
	// TODO replace toID(change) with changeID instead of recomputing
	if (toID(change) == causalBoundary) return true;
	if (change.branch == branch) return nameLt(toID(change), causalBoundary);
	if (map.get(branch) == undefined) return false;
	let nextPreds = Array.from(map.get(branch)).filter(
		([predId, boundary]) => {!visited.has(predId)});
	nextPreds.forEach(([predId, boundary]) => {visited.add(predId)});
	return nextPreds.map(([predecessorID, causalBoundary]) => {
		return checkCausallyRelevantParents(change, predecessorID, causalBoundary, map, visited)
	}).reduce((b1, b2) => {return b1 || b2}, false)
}

export {checkCausallyRelevant, BranchMap}
