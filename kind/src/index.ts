import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import { name, version } from "../package.json" with { type: "json" };

/**
 * This block's init-params contract — the shape a block of this kind receives
 * at creation, and exactly what a project template serializes for it.
 *
 * Deliberately empty: this block takes no author-supplied init params today.
 * Everything it needs is chosen in the UI after creation — the cluster
 * annotation comes from a result-pool ref the user picks, and the root cluster
 * from that column's values. Neither can be seeded from a template file while
 * the model is still on the V1 API, which has no `init()` to receive params.
 */
export type BlockParams = Record<string, never>;

/**
 * The same contract at runtime, for params that arrive from a template file
 * rather than from typed code.
 *
 * The contract names no fields, so there is nothing to read and nothing to
 * validate beyond the value being an object at all. Keys a template supplies
 * anyway are dropped by not being read. The return type holds this in step: the
 * moment `BlockParams` declares a required field, `return {}` stops compiling.
 */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  return {};
}

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({
  name,
  version,
  parseInitializationParams,
});
