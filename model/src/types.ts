import type { GraphMakerState } from "@milaboratories/graph-maker";
import type { PlRef } from "@platforma-sdk/model";

/**
 * Workflow-facing args. Unchanged from the V1 shape on purpose: the workflow
 * reads these keys verbatim, so keeping them byte-identical is what stops every
 * existing project going stale the moment it is opened on this version.
 *
 * `title` is not read by the workflow. It stays here so `.title()` keeps
 * reading the same field it always did.
 */
export type BlockArgs = {
  clusterAnnotationRef?: PlRef;
  title?: string;
  rootCluster?: string;
};

/** The view state the workflow never sees. Read only by `.upgradeLegacy` under this name. */
export type BlockUiState = {
  graphStateUMAP: GraphMakerState;
  graphStateTSNE: GraphMakerState;
  graphStatePAGA: GraphMakerState;
  graphStateViolin: GraphMakerState;
  graphStateScatterExpression: GraphMakerState;
  graphStateScatterDensity: GraphMakerState;
  anchorColumn?: PlRef;
};

/**
 * Unified V3 data — the args above plus the plot states.
 *
 * The intersection is the honest shape here. Both inputs are analysis
 * decisions the user commits and then presses Run for, so none of them belongs
 * in `prerunArgs`; this block discovers nothing and stages nothing. No V1 field
 * was bent to dodge the staleness gate, so there is no distortion to undo.
 */
export type BlockData = BlockArgs & BlockUiState;
