import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  InferOutputsType,
  PFrameHandle,
  PlRef } from '@platforma-sdk/model';
import {
  BlockModel,
  isPColumn,
  isPColumnSpec,
} from '@platforma-sdk/model';

export type UiState = {
  graphStateUMAP: GraphMakerState;
  graphStateTSNE: GraphMakerState;
  graphStateViolin: GraphMakerState;
  anchorColumn?: PlRef;
};

export type BlockArgs = {
  principalComponentsRef?: PlRef;
  clustersRef?: PlRef;
  title?: string;
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({})

  .withUiState<UiState>({
    graphStateUMAP: {
      title: 'UMAP',
      template: 'dots',
    },
    graphStateTSNE: {
      title: 'tSNE',
      template: 'dots',
    },
    graphStateViolin: {
      title: 'Violin',
      template: 'violin',
    },
  })

  .output('embeddingOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec)
      && spec.name === 'pl7.app/rna-seq/pcvalue'
    , { includeNativeLabel: true, addLabelAsSuffix: true }),
  )

  .output('clusterOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec)
      && spec.name === 'pl7.app/rna-seq/leidencluster'
    , { includeNativeLabel: true, addLabelAsSuffix: true }),
  )

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

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/umap', label: 'UMAP' },
    { type: 'link', href: '/tsne', label: 'tSNE' },
    { type: 'link', href: '/violin', label: 'Violin plot' },
  ]))

  .title((ctx) =>
    ctx.args.title
      ? `Pseudotime Inference - ${ctx.args.title}`
      : 'Pseudotime Inference',
  )

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
