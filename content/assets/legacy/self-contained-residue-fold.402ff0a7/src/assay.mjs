import { isDeepStrictEqual } from "node:util";
import { contentBytes, contentFromBytes, semanticJsonId, contentRecord } from "./semantic-json.mjs";

export const TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE = "org.emsenn.obsmetrology.typed-circuit-residue-assay.v2";
export const CIRCUIT_TRACE_PROFILE = "org.emsenn.semiotic-graph-trace.v1";
export const PROVIDER_ACCOUNT = "eip155:31337:0x48efd2177468845908699c0e19bec1e38d057225";
const DISPOSITIONS = new Set(["chu-seam-mismatch", "unpriced-irreversible-defect", "closed-flat", "translational-defect", "rotational-protected-border", "mixed-affine-defect"]);
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function exact(value) { if (value?.id !== semanticJsonId(Object.fromEntries(Object.entries(value ?? {}).filter(([key]) => key !== "id")))) fail("malformed-residue-assay", "content identity does not bind the exact value"); return value; }
function integer(value) { if (typeof value !== "string" || !/^-?(0|[1-9][0-9]*)$/u.test(value)) fail("malformed-request", "residue integer must be canonical text"); return BigInt(value); }
function rotate(turns, [x,y]) { switch (((turns%4)+4)%4) { case 0:return[x,y]; case 1:return[-y,x]; case 2:return[-x,-y]; default:return[y,-x]; } }
function add([x,y],[u,v]) { return [x+u,y+v]; }
function foldTrace(request) {
  if (!Array.isArray(request.trace) || request.trace.length < 1 || request.trace.length > 64) fail("malformed-request", "trace must contain 1 through 64 oriented seams");
  const seen = new Set(), mismatches = [], unpriced = [], price = new Map(); let turns=0, translation=[0n,0n], frame=null;
  for (const step of request.trace) {
    const receipt=step?.receipt; if (!receipt || typeof receipt !== "object") fail("malformed-request", "each trace step requires a receipt");
    const key=`${receipt.originatingSettlement}\0${receipt.receiptId}`; if(seen.has(key)) fail("receipt-replay", `receipt-replay: ${receipt.receiptId}`); seen.add(key);
    if (!isDeepStrictEqual(receipt.chu?.left, receipt.chu?.right)) mismatches.push(receipt.receiptId);
    const connection=receipt.connection; if (!connection || !Number.isInteger(connection.quarterTurns) || !Array.isArray(connection.translation)) fail("malformed-request", "connection must carry C4 rotation and Z2 translation");
    if(frame!==null&&frame!==connection.frame) fail("frame-transport-mismatch", "all seams must inhabit one frame"); frame??=connection.frame;
    const orientation=receipt.orientation===-1?-1:1, edgeTurns=orientation===1?connection.quarterTurns:-connection.quarterTurns;
    const edgeVector=connection.translation.map(integer); const directed=orientation===1?edgeVector:rotate(edgeTurns,edgeVector).map((x)=>-x);
    translation=add(rotate(edgeTurns,translation),directed); turns=((turns+edgeTurns)%4+4)%4;
    const erasure=receipt.priceErasure; const amount=integer(erasure.irreversibleAmount), priced=integer(erasure.priceAmount); const row=price.get(erasure.unit)??{orientedPrice:0n,irreversibleMagnitude:0n,unpricedIrreversibleReceipts:[]}; row.orientedPrice+=BigInt(orientation)*priced; row.irreversibleMagnitude+=amount; if(amount>0n&&priced===0n){row.unpricedIrreversibleReceipts.push(receipt.receiptId);unpriced.push(receipt.receiptId);} price.set(erasure.unit,row);
  }
  let disposition; const border=request.borderClass;
  if(mismatches.length) disposition="chu-seam-mismatch"; else if(unpriced.length) disposition="unpriced-irreversible-defect"; else if(turns===0&&translation.every((x)=>x===0n)&&border?.type==="internal"&&border.allowedHolonomy===0) disposition="closed-flat"; else if(turns===0) disposition="translational-defect"; else if(border?.type==="protected"&&border.allowedHolonomy===turns&&translation.every((x)=>x===0n)) disposition="rotational-protected-border"; else if(!translation.every((x)=>x===0n)) disposition="mixed-affine-defect"; else fail("undeclared-border-class", `C4 holonomy ${turns} is outside the declared border`);
  return { disposition, residues:{ chuSeamDefect:{mismatchCount:mismatches.length,mismatchedReceipts:mismatches}, connectionHolonomy:{group:"C4",quarterTurns:turns,identity:turns===0}, translationalHolonomy:{group:"Z^2",frame,vector:translation.map(String),identity:translation.every((x)=>x===0n)}, priceErasureResidue:[...price].map(([unit,row])=>({unit,orientedPrice:String(row.orientedPrice),irreversibleMagnitude:String(row.irreversibleMagnitude),unpricedIrreversibleReceipts:row.unpricedIrreversibleReceipts})) }, receiptCount:request.trace.length, fuelUsed:request.trace.length };
}
export function encodeTypedCircuitResidueAssayRequest(source) { return contentRecord({ type:"SemioticGraphTraceAssayRequest", profile:CIRCUIT_TRACE_PROFILE, ...source }); }
export function decodeTypedCircuitResidueAssayRequest(value) { exact(value); if(value.type!=="SemioticGraphTraceAssayRequest"||value.profile!==CIRCUIT_TRACE_PROFILE) fail("malformed-residue-assay","wrong graph trace request profile"); return value; }
export function assayTypedCircuitResidue(source) { const request=encodeTypedCircuitResidueAssayRequest(source), result=foldTrace(request); const receipt=contentRecord({kind:"TypedCircuitResidueAssayReceipt",profile:TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE,traceProfile:CIRCUIT_TRACE_PROFILE,provider:PROVIDER_ACCOUNT,request:request.id,circuit:semanticJsonId(request.circuit),assembly:semanticJsonId(request.assembly),components:request.components.map(semanticJsonId),...result}); return {receipt,semanticId:receipt.id,canonicalBytes:contentBytes(receipt)}; }
export function decodeTypedCircuitResidueAssayReceipt(value) { exact(value); if(value.kind!=="TypedCircuitResidueAssayReceipt"||value.profile!==TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE||value.traceProfile!==CIRCUIT_TRACE_PROFILE||value.provider!==PROVIDER_ACCOUNT||!DISPOSITIONS.has(value.disposition)) fail("malformed-residue-assay","foreign or malformed residue receipt"); return Object.freeze(value); }
export const residueBytes=contentBytes; export const residueFromBytes=contentFromBytes;
