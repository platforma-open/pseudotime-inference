<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import { PlBlockPage, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';

const app = useApp();

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
    <template #title>Settings</template>
    <PlDropdownRef
      v-model="app.model.args.principalComponentsRef" :options="app.model.outputs.embeddingOptions"
      :style="{ width: '320px' }"
      label="Select dataset"
      clearable @update:model-value="setInput"
    />
    <PlDropdownRef
      v-model="app.model.args.clustersRef" :options="app.model.outputs.clusterOptions"
      :style="{ width: '320px' }"
      label="Select clusters"
      clearable @update:model-value="setInput"
    />
  </PlBlockPage>
</template>
