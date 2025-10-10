<script setup lang="ts">
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';
import { useApp } from '../app';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'scatterplot-umap'>[] => {
  const pcols = app.model.outputs.scatterplotPcols;
  if (!pcols || pcols.length === 0)
    return [];

  const pseudotimeCol = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/pseudotimedpt');
  const countCol = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/countMatrix'
    && p.spec.domain?.['pl7.app/rna-seq/normalized'] === 'true');

  if (pseudotimeCol === -1 || countCol === -1)
    return [];

  return [
    {
      inputName: 'x',
      selectedSource: pcols[pseudotimeCol].spec,
    },
    {
      inputName: 'y',
      selectedSource: pcols[countCol].spec,
    },
    {
      inputName: 'grouping',
      selectedSource: pcols[pseudotimeCol].spec,
    },
    // Cell ID
    // {
    //   inputName: 'tooltipContent',
    //   selectedSource: pcols[pseudotimeCol].spec.axesSpec[1],
    // },
    {
      inputName: 'filters',
      selectedSource: pcols[countCol].spec.axesSpec[2],
    },
  ];
});

const key = computed(() => defaultOptions.value ? JSON.stringify(defaultOptions.value) : '');
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      :key="key"
      v-model="app.model.ui.graphStateScatterExpression"
      chart-type="scatterplot-umap"
      :p-frame="app.model.outputs.scatterplotPf"
      :default-options="defaultOptions"
    />
  </PlBlockPage>
</template>
