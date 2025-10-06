<script setup lang="ts">
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import type { PColumnIdAndSpec, PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import { PlBlockPage, PlDropdownRef, PlTabs } from '@platforma-sdk/ui-vue';
import { computed, reactive } from 'vue';
import { useApp } from '../app';

const app = useApp();

const data = reactive({
  currentTab: 'umap',
});

const tabOptions = [
  { label: 'UMAP', value: 'umap' },
  { label: 't-SNE', value: 'tsne' },
];

function getIndex(name: string, pcols: PColumnIdAndSpec[]): number {
  return pcols.findIndex((p) => (p.spec.name === name
  ));
}

/* Function to create default options according to the selected tab */
function createDefaultOptions(
  pcols: PColumnIdAndSpec[] | undefined,
  coord1Name: string,
  coord2Name: string,
): PredefinedGraphOption<'scatterplot-umap'>[] | undefined {
  if (!pcols || pcols.length === 0)
    return undefined;

  const coord1Index = getIndex(coord1Name, pcols);
  const coord2Index = getIndex(coord2Name, pcols);
  const pseudotimeIndex = getIndex('pl7.app/rna-seq/pseudotimedpt', pcols);

  if (coord1Index === -1 || coord2Index === -1)
    return undefined;

  const defaults: PredefinedGraphOption<'scatterplot-umap'>[] = [
    {
      inputName: 'x',
      selectedSource: pcols[coord1Index].spec,
    },
    {
      inputName: 'y',
      selectedSource: pcols[coord2Index].spec,
    },
    {
      inputName: 'grouping',
      selectedSource: pcols[pseudotimeIndex].spec,
    },
  ];

  return defaults;
}

const defaultOptions = computed((): PredefinedGraphOption<'scatterplot-umap'>[] | undefined => {
  if (data.currentTab === 'umap') {
    return createDefaultOptions(
      app.model.outputs.plotPcols,
      'pl7.app/rna-seq/umap1',
      'pl7.app/rna-seq/umap2',
    );
  }
  if (data.currentTab === 'tsne') {
    return createDefaultOptions(
      app.model.outputs.plotPcols,
      'pl7.app/rna-seq/tsne1',
      'pl7.app/rna-seq/tsne2',
    );
  }
  return undefined;
});

/* Modify graph state, pframe and default options based on the selected tab */
const graphState = computed({
  get: () => data.currentTab === 'umap' ? app.model.ui.graphStateUMAP : app.model.ui.graphStateTSNE,
  set: (value) => {
    if (data.currentTab === 'umap')
      app.model.ui.graphStateUMAP = value;
    else
      app.model.ui.graphStateTSNE = value;
  },
});

const pFrame = computed(() => data.currentTab === 'umap' ? app.model.outputs.UMAPPf : app.model.outputs.tSNEPf);

</script>

<template>
  <PlBlockPage>
    <GraphMaker
      :key="`${data.currentTab}-${pFrame}`"
      v-model="graphState"
      chartType="scatterplot-umap"
      :p-frame="pFrame"
      :default-options="defaultOptions"
    >
      <template #titleLineSlot>
        <PlTabs v-model="data.currentTab" :options="tabOptions" :style="{ display: 'flex', justifyContent: 'flex-end' }"/>
      </template>
      <template #settingsSlot>
        <PlDropdownRef
          v-model="app.model.args.clusterAnnotationRef"
          :options="app.model.outputs.clusterAnnotationOptions"
          :style="{ width: '320px' }"
          label="Cluster annotation"
          clearable
          required
        />
      </template>
    </GraphMaker>
  </PlBlockPage>
</template>
