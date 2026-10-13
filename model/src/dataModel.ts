import { kind } from "@platforma-open/milaboratories.pseudotime-inference.kind";
import { DataModelBuilder } from "@platforma-sdk/model";
import type { BlockArgs, BlockData, BlockUiState } from "./types";

export const blockDataModel = new DataModelBuilder({ kind })
  .from<BlockData>("v1")
  // V1 kept these in two buckets and V3 keeps one, but the fields are the same
  // fields — the merge is the whole upgrade.
  .upgradeLegacy<BlockArgs, BlockUiState>(({ args, uiState }) => ({
    ...args,
    ...uiState,
  }))
  .init(({ params }) => ({
    clusterAnnotationRef: params?.clusterAnnotationRef,
    rootCluster: params?.rootCluster,

    graphStateUMAP: {
      title: "UMAP",
      template: "dots",
      currentTab: "settings",
    },
    graphStateTSNE: {
      title: "tSNE",
      template: "dots",
      currentTab: null,
    },
    graphStatePAGA: {
      title: "PAGA graph",
      template: "dots",
      currentTab: null,
    },
    graphStateViolin: {
      title: "Cluster Pseudotime",
      template: "violin",
      currentTab: null,
    },
    graphStateScatterExpression: {
      title: "Gene Expression",
      template: "dots",
      currentTab: null,
    },
    graphStateScatterDensity: {
      title: "Cell Density",
      template: "dots",
      currentTab: null,
    },
  }));
