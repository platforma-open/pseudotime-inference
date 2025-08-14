<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';
import { useApp } from '../app';

import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'discrete'>[] => {
  const pcols = app.model.outputs.violinPcols;
  if (!pcols || pcols.length === 0)
    return [];

  const yIndex = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/pseudotimedpt');
  const primaryGroupingIndex = pcols.findIndex((p) => p.spec.name === 'pl7.app/rna-seq/leidencluster');

  if (yIndex === -1 || primaryGroupingIndex === -1)
    return [];

  return [
    {
      inputName: 'y',
      selectedSource: pcols[yIndex].spec,
    },
    {
      inputName: 'primaryGrouping',
      selectedSource: pcols[primaryGroupingIndex].spec,
    },
  ];
});
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      v-model="app.model.ui.graphStateViolin"
      chart-type="discrete"
      :p-frame="app.model.outputs.violinPf"
      :default-options="defaultOptions"
      :data-state-key="app.model.outputs.violinPf"
    />
  </PlBlockPage>
</template>
