import { kind } from "@platforma-open/milaboratories.pseudotime-inference.kind";
import type {
  InferOutputsType,
  PColumnIdAndSpec,
  PFrameHandle,
  TreeNodeAccessor,
} from "@platforma-sdk/model";
import {
  BlockModelV3,
  createPFrameForGraphs,
  isPColumn,
  isPColumnSpec,
} from "@platforma-sdk/model";
import { blockDataModel } from "./dataModel";
import type { BlockArgs } from "./types";

export { blockDataModel } from "./dataModel";
export type { BlockArgs, BlockData, BlockUiState } from "./types";

export const platforma = BlockModelV3.create({ dataModel: blockDataModel, kind })

  // The run gate. Throwing shows the reason in the UI. Same check as the V1
  // `.argsValid`: a cluster annotation must be selected.
  .args<BlockArgs>((data): BlockArgs => {
    if (data.clusterAnnotationRef === undefined) {
      throw new Error("Select a cluster annotation");
    }

    return {
      clusterAnnotationRef: data.clusterAnnotationRef,
      title: data.title,
      rootCluster: data.rootCluster,
    };
  })

  // Inverse of the kind's init-params contract: the two settings a user picks
  // by hand. `title` is left out — nothing in the UI sets it.
  .templateParams((data) => ({
    clusterAnnotationRef: data.clusterAnnotationRef,
    rootCluster: data.rootCluster,
  }))

  .output("clusterAnnotationOptions", (ctx) =>
    ctx.resultPool.getOptions(
      (spec) => isPColumnSpec(spec) && spec.name === "pl7.app/rna-seq/leidencluster",
      { includeNativeLabel: true, addLabelAsSuffix: true },
    ),
  )

  .output("selectedClusterPf", (ctx) => {
    if (ctx.data.clusterAnnotationRef === undefined) return undefined;
    const pCols = ctx.resultPool.getPColumnByRef(ctx.data.clusterAnnotationRef);
    if (pCols === undefined) return undefined;
    return ctx.createPFrame([pCols]);
  })

  .output("anchorSpec", (ctx) => {
    // return the Reference of the p-column selected as input dataset in Settings
    if (!ctx.data.anchorColumn) return undefined;

    // Get the specs of that selected p-column
    const anchorColumn = ctx.resultPool.getPColumnByRef(ctx.data.anchorColumn);
    return anchorColumn?.spec;
  })

  .outputWithStatus("UMAPPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter((col) => {
        return (
          col.spec.name === "pl7.app/rna-seq/umap1" ||
          col.spec.name === "pl7.app/rna-seq/umap2" ||
          col.spec.name === "pl7.app/rna-seq/umap3"
        );
      });

    // enriching with leiden clusters data
    const upstream = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .outputWithStatus("tSNEPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter((col) => {
        return (
          col.spec.name === "pl7.app/rna-seq/tsne1" ||
          col.spec.name === "pl7.app/rna-seq/tsne2" ||
          col.spec.name === "pl7.app/rna-seq/tsne3"
        );
      });

    // enriching with leiden clusters data
    const upstream = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .outputWithStatus("PAGAPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve("pagaGraph")?.getPColumns();

    // enriching with leiden clusters data
    const upstream = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();

    if (upstream === undefined || pCols === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output("plotPcols", (ctx) => {
    const pCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter((col) => {
        return (
          col.spec.name.slice(0, -1) === "pl7.app/rna-seq/tsne" ||
          col.spec.name.slice(0, -1) === "pl7.app/rna-seq/umap"
        );
      });

    // enriching with leiden clusters data
    const upstream1 = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();
    const upstream2 = ctx.outputs?.resolve("pagaGraph")?.getPColumns();

    if (upstream1 === undefined || upstream2 === undefined) {
      return undefined;
    }

    return [...pCols, ...upstream1, ...upstream2].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  .output("violinPcols", (ctx) => {
    // Get specifically the clusters pcol selected by user in settings
    const clusterAnchor = ctx.data.clusterAnnotationRef;
    if (clusterAnchor === undefined) return undefined;
    const clusterPcol = ctx.resultPool.getPColumnByRef(clusterAnchor);
    if (clusterPcol === undefined) return undefined;

    const upstream = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return [clusterPcol, ...upstream].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  .outputWithStatus("violinPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter((col) => {
        return (
          col.spec.name === "pl7.app/rna-seq/leidencluster" || col.spec.name === "pl7.app/metadata"
        );
      });

    // enriching with leiden clusters data
    const upstream = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .outputWithStatus("scatterplotPf", (ctx): PFrameHandle | undefined => {
    // Get pseudotime scores
    const pseudotimeCols = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();
    const umapDensityCols = ctx.outputs?.resolve("umapDensity")?.getPColumns();

    if (pseudotimeCols === undefined || umapDensityCols === undefined) {
      return undefined;
    }

    return createPFrameForGraphs(ctx, [...pseudotimeCols, ...umapDensityCols]);
  })

  .output("scatterplotPcols", (ctx) => {
    const pseudotimeCols = ctx.outputs?.resolve("pseudotimeScores")?.getPColumns();
    const umapDensityCols = ctx.outputs?.resolve("umapDensity")?.getPColumns();

    const geneExpressionCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter((col) => {
        return (
          col.spec.name === "pl7.app/rna-seq/countMatrix" ||
          col.spec.name === "pl7.app/rna-seq/leidencluster"
        );
      });

    if (
      pseudotimeCols === undefined ||
      geneExpressionCols.length === 0 ||
      umapDensityCols === undefined
    ) {
      return undefined;
    }

    return [...pseudotimeCols, ...geneExpressionCols, ...umapDensityCols].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  .output("isRunning", (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .sections((_ctx) => [
    { type: "link", href: "/", label: "UMAP" },
    { type: "link", href: "/violin", label: "Cluster Pseudotime" },
    // { type: 'link', href: '/scatterExpression', label: 'Gene Expression' },
    { type: "link", href: "/scatterDensity", label: "Cell Density" },
  ])

  .title((ctx) =>
    ctx.data.title ? `Pseudotime Inference - ${ctx.data.title}` : "Pseudotime Inference",
  )

  .done();

export type BlockOutputs = InferOutputsType<typeof platforma>;
