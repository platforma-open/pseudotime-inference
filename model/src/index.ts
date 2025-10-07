import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  InferOutputsType,
  PColumnIdAndSpec,
  PFrameHandle,
  PlRef,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPFrameForGraphs,
  isPColumn,
  isPColumnSpec,
} from '@platforma-sdk/model';

export type UiState = {
  graphStateUMAP: GraphMakerState;
  graphStateTSNE: GraphMakerState;
  graphStatePAGA: GraphMakerState;
  graphStateViolin: GraphMakerState;
  graphStateScatterExpression: GraphMakerState;
  anchorColumn?: PlRef;
};

export type BlockArgs = {
  clusterAnnotationRef?: PlRef;
  title?: string;
  rootCluster?: string;
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({})

  .argsValid((ctx) => {
    return ctx.args.clusterAnnotationRef !== undefined;
  })

  .withUiState<UiState>({
    graphStateUMAP: {
      title: 'UMAP',
      template: 'dots',
      currentTab: 'settings',
    },
    graphStateTSNE: {
      title: 'tSNE',
      template: 'dots',
    },
    graphStatePAGA: {
      title: 'PAGA graph',
      template: 'dots',
    },
    graphStateViolin: {
      title: 'Violin',
      template: 'violin',
    },
    graphStateScatterExpression: {
      title: 'Scatter Expression',
      template: 'dots',
    },
  })

  .output('clusterAnnotationOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec)
      && (spec.name === 'pl7.app/rna-seq/leidencluster'
        || spec.name === 'pl7.app/rna-seq/cellType')
    , { includeNativeLabel: true, addLabelAsSuffix: true }),
  )

  .output('selectedClusterPf', (ctx) => {
    if (ctx.args.clusterAnnotationRef === undefined) return undefined;
    const pCols = ctx.resultPool.getPColumnByRef(ctx.args.clusterAnnotationRef);
    if (pCols === undefined) return undefined;
    return ctx.createPFrame([pCols]);
  })

  .output('anchorSpec', (ctx) => {
    // return the Reference of the p-column selected as input dataset in Settings
    if (!ctx.uiState?.anchorColumn) return undefined;

    // Get the specs of that selected p-column
    const anchorColumn = ctx.resultPool.getPColumnByRef(ctx.uiState?.anchorColumn);
    const anchorSpec = anchorColumn?.spec;
    if (!anchorSpec) {
      console.error('Anchor spec is undefined or is not PColumnSpec', anchorSpec);
      return undefined;
    }

    return anchorSpec;
  })

  .output('UMAPPf', (ctx): PFrameHandle | undefined => {
    const pCols
      = ctx.resultPool
        .getData()
        .entries.map((c) => c.obj)
        .filter(isPColumn)
        .filter((col) => {
          return col.spec.name === 'pl7.app/rna-seq/umap1'
            || col.spec.name === 'pl7.app/rna-seq/umap2'
            || col.spec.name === 'pl7.app/rna-seq/umap3';
        });

    // enriching with leiden clusters data
    const upstream
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output('tSNEPf', (ctx): PFrameHandle | undefined => {
    const pCols
      = ctx.resultPool
        .getData()
        .entries.map((c) => c.obj)
        .filter(isPColumn)
        .filter((col) => {
          return col.spec.name === 'pl7.app/rna-seq/tsne1'
            || col.spec.name === 'pl7.app/rna-seq/tsne2'
            || col.spec.name === 'pl7.app/rna-seq/tsne3';
        });

    // enriching with leiden clusters data
    const upstream
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output('PAGAPf', (ctx): PFrameHandle | undefined => {
    const pCols
        = ctx.outputs?.resolve('pagaGraph')?.getPColumns();

    // enriching with leiden clusters data
    const upstream
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    if (upstream === undefined || pCols === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output('plotPcols', (ctx) => {
    const pCols
      = ctx.resultPool
        .getData()
        .entries.map((c) => c.obj)
        .filter(isPColumn)
        .filter((col) => {
          return (col.spec.name.slice(0, -1) === 'pl7.app/rna-seq/tsne'
            || col.spec.name.slice(0, -1) === 'pl7.app/rna-seq/umap');
        });

    // enriching with leiden clusters data
    const upstream1
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();
    const upstream2
      = ctx.outputs?.resolve('pagaGraph')?.getPColumns();

    if (upstream1 === undefined || upstream2 === undefined) {
      return undefined;
    }

    return [...pCols, ...upstream1, ...upstream2].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('violinPcols', (ctx) => {
    // Get specifically the clusters pcol selected by user in settings
    const clusterAnchor = ctx.args.clusterAnnotationRef;
    if (clusterAnchor === undefined)
      return undefined;
    const clusterPcol = ctx.resultPool.getPColumnByRef(clusterAnchor);
    if (clusterPcol === undefined)
      return undefined;

    const upstream
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return [clusterPcol, ...upstream].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('violinPf', (ctx): PFrameHandle | undefined => {
    const pCols
      = ctx.resultPool
        .getData()
        .entries.map((c) => c.obj)
        .filter(isPColumn)
        .filter((col) => {
          return col.spec.name === 'pl7.app/rna-seq/leidencluster'
            || col.spec.name === 'pl7.app/metadata';
        });

    // enriching with leiden clusters data
    const upstream
      = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    if (upstream === undefined) {
      return undefined;
    }

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output('scatterplotPf', (ctx): PFrameHandle | undefined => {
    // Get pseudotime scores
    const pseudotimeCols = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    // Get normalized gene expression data from result pool
    const geneExpressionCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) => {
        // Look for gene expression columns
        return col.spec.name === 'pl7.app/rna-seq/countMatrix';
      });

    if (pseudotimeCols === undefined || geneExpressionCols.length === 0) {
      return undefined;
    }

    return createPFrameForGraphs(ctx, pseudotimeCols);
  })

  .output('scatterplotPcols', (ctx) => {
    const pseudotimeCols = ctx.outputs?.resolve('pseudotimeScores')?.getPColumns();

    const geneExpressionCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) => {
        return col.spec.name === 'pl7.app/rna-seq/countMatrix';
      });

    if (pseudotimeCols === undefined || geneExpressionCols.length === 0) {
      return undefined;
    }

    return [...pseudotimeCols, ...geneExpressionCols].map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/violin', label: 'Violin plot' },
    { type: 'link', href: '/scatterExpression', label: 'Expression and Pseudotime' },
  ]))

  .title((ctx) =>
    ctx.args.title
      ? `Pseudotime Inference - ${ctx.args.title}`
      : 'Pseudotime Inference',
  )

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
