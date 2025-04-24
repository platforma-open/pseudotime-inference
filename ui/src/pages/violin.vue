<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';

import type { GraphMakerProps } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';

const app = useApp();

const defaultOptions: GraphMakerProps['defaultOptions'] = [
  {
    inputName: 'y',
    selectedSource: {
      kind: 'PColumn',
      name: 'pl7.app/rna-seq/pseudotimedpt',
      valueType: 'Double',
      axesSpec: [
        {
          name: 'pl7.app/sampleId',
          type: 'String',
        },
        {
          name: 'pl7.app/cellId',
          type: 'String',
        },
      ],
    },
  },
  {
    inputName: 'primaryGrouping',
    selectedSource: {
      kind: 'PColumn',
      name: 'pl7.app/rna-seq/leidencluster',
      valueType: 'String',
      axesSpec: [
        {
          name: 'pl7.app/sampleId',
          type: 'String',
        },
        {
          name: 'pl7.app/cellId',
          type: 'String',
        },
      ],
    },
  },
];

</script>

<template>
  <PlBlockPage>
    <GraphMaker v-model="app.model.ui.graphStateViolin" chartType="discrete" :p-frame="app.model.outputs.violinPf" :default-options="defaultOptions" />
  </PlBlockPage>
</template>
