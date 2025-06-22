<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import { PlBlockPage, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import type { GraphMakerProps } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import { ref } from 'vue';

const app = useApp();
const settingsOpen = ref(true);

const defaultOptions: GraphMakerProps['defaultOptions'] = [
  {
    inputName: 'x',
    selectedSource: {
      kind: 'PColumn',
      name: 'pl7.app/rna-seq/umap1',
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
    inputName: 'y',
    selectedSource: {
      kind: 'PColumn',
      name: 'pl7.app/rna-seq/umap2',
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
    inputName: 'grouping',
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
];

function setInput(inputRef?: PlRef) {
  app.model.args.principalComponentsRef = inputRef;
  if (inputRef)
    app.model.args.title = app.model.outputs.embeddingOptions?.find((o) => plRefsEqual(o.ref, inputRef))?.label;
  else
    app.model.args.title = undefined;
}
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      v-model="app.model.ui.graphStateUMAP"
      chartType="scatterplot-umap"
      :p-frame="app.model.outputs.UMAPPf"
      :default-options="defaultOptions"
      @run="settingsOpen = false"
    >
      <template v-if="settingsOpen" #settingsSlot>
        <PlDropdownRef
          v-model="app.model.args.principalComponentsRef"
          :options="app.model.outputs.embeddingOptions"
          :style="{ width: '320px' }"
          label="Select dataset"
          clearable
          required
          @update:model-value="setInput"
        />
        <PlDropdownRef
          v-model="app.model.args.clustersRef"
          :options="app.model.outputs.clusterOptions"
          :style="{ width: '320px' }"
          label="Select clusters"
          clearable
          required
        />
      </template>
    </GraphMaker>
  </PlBlockPage>
</template>
