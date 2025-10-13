<script setup lang="ts">
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';
import { useApp } from '../app';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'scatterplot'>[] => {
  const pcols = app.model.outputs.scatterplotPcols;
  if (!pcols || pcols.length === 0)
    return [];

  const pseudotimeCol = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/pseudotimedpt');
  const densityCol = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/umapdensity');
  const clusterCol = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/leidencluster');

  if (pseudotimeCol === -1 || clusterCol === -1)
    return [];

  return [
    {
      inputName: 'x',
      selectedSource: pcols[pseudotimeCol].spec,
    },
    {
      inputName: 'y',
      selectedSource: pcols[densityCol].spec,
    },
    {
      inputName: 'grouping',
      selectedSource: pcols[clusterCol].spec,
    },
    // Cell ID
    {
      inputName: 'tooltipContent',
      selectedSource: pcols[clusterCol].spec.axesSpec[1],
    },
  ];
});

const key = computed(() => defaultOptions.value ? JSON.stringify(defaultOptions.value) : '');
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      :key="key"
      v-model="app.model.ui.graphStateScatterDensity"
      chart-type="scatterplot"
      :p-frame="app.model.outputs.scatterplotPf"
      :default-options="defaultOptions"
    />
  </PlBlockPage>
</template>
