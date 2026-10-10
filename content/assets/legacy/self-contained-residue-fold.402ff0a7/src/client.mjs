import { randomUUID } from "node:crypto";
import { Message, Role } from "@a2a-js/sdk";
import { a2aResultParts, sendRmnTask } from "@red-cup-engineering/a2a-rmn-task-client-service";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-rmn-part-service";
import { decodeTypedCircuitResidueAssayReceipt, encodeTypedCircuitResidueAssayRequest, residueBytes, residueFromBytes } from "./assay.mjs";
export { CIRCUIT_TRACE_PROFILE } from "./assay.mjs";
export async function requestTypedCircuitResidueAssay({agentUrl,circuit,components=[],assembly,borderClass,trace,signal,send=sendRmnTask}) { const request=encodeTypedCircuitResidueAssayRequest({circuit,components,assembly,borderClass,trace}); try { const message=Message.toJSON({messageId:randomUUID(),contextId:"",taskId:"",role:Role.ROLE_USER,parts:[rmnPart(residueBytes(request),"semiotic-graph-trace-request.rmn.cbor")],metadata:{request:request.id},extensions:[],referenceTaskIds:[]}); const exchange=await send({agentUrl,message,requireSignature:true,...(signal?{signal}:{})}); const receipt=decodeTypedCircuitResidueAssayReceipt(residueFromBytes(extractRmnPart(a2aResultParts(exchange.result)).bytes)); if(receipt.request!==request.id)throw new Error("residue receipt does not bind the exact request"); return {receipt,receiptNi:receipt.id,exchange}; } catch(error) { error.inputNi ??= request.id; throw error; } }
