import {ID, Index} from "./types/Types";
import {BasePrimitive, ObjectKind} from "./types/Primitive";

type Entry = { name: ID, kind: ObjectKind, value: BasePrimitive | ID, deleted: boolean };
type MetaObject = Map<Index, Entry> | Array<Entry>;
type MetaMap = Map<ID, MetaObject>;

export type {Entry, MetaObject, MetaMap};
