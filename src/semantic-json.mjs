import { EMPTY_WITNESS_ROOT, admitJsonSemanticContent, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";
const OBJECT_KIND = "lenticule-science.typed-circuit-residue-assay.json";
export function identified(value) { return identifyJsonSemanticContent({ objectKind: OBJECT_KIND, value, witnessRoot: EMPTY_WITNESS_ROOT }); }
export function semanticJsonId(value) { return identified(value).token; }
export function contentBytes(value) { return identified(value).bytes; }
export function contentFromBytes(bytes) { return admitJsonSemanticContent({ bytes, objectKind: OBJECT_KIND }).value; }
export function contentRecord(value) { const source = structuredClone(value); return Object.freeze({ ...source, id: semanticJsonId(source) }); }
