import { readFileSync } from "node:fs";
import { compileRmlLaw } from "@red-cup-engineering/rmn-semantic-conformance/law";
export const TYPED_CIRCUIT_RESIDUE_ASSAY_LAW = compileRmlLaw(readFileSync(new URL("../content/contracts/assay-typed-circuit-residue.rml", import.meta.url), "utf8"));
