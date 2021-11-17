import {ID, Index} from "./API";
import {BasePrimitive, ObjectKind} from "./Primitive";

type Entry = { creator: ID, editor: ID, kind: ObjectKind, value: BasePrimitive | ID, deleted: ID | undefined };
type MetaObject = Map<Index, Entry> | Array<Entry>;
type MetaMap = Map<ID, MetaObject>;

export type {Entry, MetaObject, MetaMap};
