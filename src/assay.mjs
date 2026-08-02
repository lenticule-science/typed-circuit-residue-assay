import { semanticBytes, semanticId } from "@red-cup-engineering/relation-model-notation-runtime";
import { CIRCUIT_TRACE_PROFILE, assayCircuitTrace, encodeCircuitTraceRequest } from "@red-cup-engineering/relation-model-notation-runtime/circuit-residue";
import { decodeRelationalValue, encodeRelationalValue, RELATIONAL_VALUE_TYPE } from "@red-cup-engineering/relation-model-notation-runtime/relational-value";

export const TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE = "org.emsenn.obsmetrology.typed-circuit-residue-assay.v1";
export const PROVIDER_ACCOUNT = "eip155:31337:0x48efd2177468845908699c0e19bec1e38d057225";
const NI = /^ni:\/\/\/sha-256;[A-Za-z0-9_-]{43}$/u;
const DISPOSITIONS = new Set(["chu-seam-mismatch", "unpriced-irreversible-defect", "closed-flat", "translational-defect", "rotational-protected-border", "mixed-affine-defect"]);
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function exactKeys(value, keys) { return value && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0"); }
function typed(value) { const encoded = encodeRelationalValue(value), term = ["ascribe", encoded.type, encoded.term]; return { id: semanticId(term), bytes: semanticBytes(term), type: encoded.type, term: encoded.term }; }

export function encodeTypedCircuitResidueAssayRequest(source) { return encodeCircuitTraceRequest(source); }
export function decodeTypedCircuitResidueAssayRequest(type, term) {
  if (JSON.stringify(type) !== JSON.stringify(RELATIONAL_VALUE_TYPE)) fail("malformed-residue-assay", "typed circuit residue request must use the relational RMN type");
  return encodeCircuitTraceRequest(decodeRelationalValue(type, term)).value;
}

export function assayTypedCircuitResidue(source) {
  const request = encodeCircuitTraceRequest(source).value, result = assayCircuitTrace(request), requestDocument = typed(request);
  const receipt = {
    kind: "TypedCircuitResidueAssayReceipt", profile: TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE,
    traceProfile: CIRCUIT_TRACE_PROFILE, provider: PROVIDER_ACCOUNT, request: requestDocument.id,
    circuit: result.circuit, assembly: result.assembly, components: result.components,
    disposition: result.disposition, residues: result.residues,
    receiptCount: result.receiptCount, fuelUsed: result.fuelUsed,
  };
  const document = typed(receipt);
  return { receipt, semanticId: document.id, canonicalBytes: document.bytes, type: document.type, term: document.term };
}

export function decodeTypedCircuitResidueAssayReceipt(type, term) {
  if (JSON.stringify(type) !== JSON.stringify(RELATIONAL_VALUE_TYPE)) fail("malformed-residue-assay", "typed circuit residue receipt must use the relational RMN type");
  const value = decodeRelationalValue(type, term);
  const fields = ["assembly", "circuit", "components", "disposition", "fuelUsed", "kind", "profile", "provider", "receiptCount", "request", "residues", "traceProfile"];
  if (!exactKeys(value, fields) || value.kind !== "TypedCircuitResidueAssayReceipt" || value.profile !== TYPED_CIRCUIT_RESIDUE_ASSAY_PROFILE || value.traceProfile !== CIRCUIT_TRACE_PROFILE || value.provider !== PROVIDER_ACCOUNT || ![value.request, value.circuit, value.assembly].every((identity) => NI.test(identity ?? "")) || !Array.isArray(value.components) || !value.components.every((identity) => NI.test(identity)) || !DISPOSITIONS.has(value.disposition)) fail("malformed-residue-assay", "typed circuit residue receipt has an unknown, absent, legacy, or foreign-provider field");
  return value;
}
