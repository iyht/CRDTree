
import {ID} from "./types/Types";

type Timestamp = {clock: number, pid: string};

const nameLt = (a: ID, b: ID): boolean => {
	return clockLt(toTimestamp(a), toTimestamp(b));
};

const toTimestamp = (id: ID): Timestamp => {
	const [pid, clockString] = id.split("@");
	const clock = Number(clockString);
	return {pid, clock};
};

const clockLt = (a: Timestamp, b: Timestamp): boolean => {
	if (a.clock < b.clock) return true;
	if (b.clock < a.clock) return false;
	if (a.pid < b.pid) return true;
	if (b.pid < a.pid) return false;
	throw new EvalError("Two items in list with same name should be impossible");
};

export {nameLt, toTimestamp, clockLt};
