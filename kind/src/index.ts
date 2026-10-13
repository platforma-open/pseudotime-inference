import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import type { PlRef } from "@platforma-sdk/model";
import { isPlRef } from "@platforma-sdk/model";
import { name, version } from "../package.json" with { type: "json" };

/**
 * This block's init-params contract — the two settings a user picks by hand:
 * the cluster annotation the trajectory is built on, and the cluster DPT
 * starts from.
 *
 * `title` is absent. Nothing in the UI sets it, so a template has nothing of
 * its own to carry there.
 *
 * Both fields are optional. A block with nothing selected is ordinary state the
 * UI reaches — it is exactly what a freshly created block looks like — and the
 * projection hands that state back untouched, so a required field would make
 * this block export a file its own kind refuses.
 */
export type BlockParams = {
  clusterAnnotationRef?: PlRef;
  rootCluster?: string;
};

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({
  name,
  version,
  parseInitializationParams,
});

// Internals

/** The same contract at runtime, for params arriving from a template file rather than typed code. */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const { clusterAnnotationRef, rootCluster } = value;

  if (clusterAnnotationRef !== undefined && !isPlRef(clusterAnnotationRef)) {
    throw new Error(
      "'clusterAnnotationRef' must be a reference to an upstream column, written as { __isRef: true, blockId, name }.",
    );
  }
  if (rootCluster !== undefined && typeof rootCluster !== "string") {
    throw new Error("'rootCluster' must be a string: one value of the cluster annotation column.");
  }

  return { clusterAnnotationRef, rootCluster };
}
