import { model } from '@platforma-open/milaboratories.pseudotime-inference.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import MainPage from './pages/MainPage.vue';
import ScatterDensity from './pages/scatterdensity.vue';
import ScatterExpression from './pages/scatterplot.vue';
import Violin from './pages/violin.vue';

export const sdkPlugin = defineApp(model, () => {
  return {
    routes: {
      '/': () => MainPage,
      '/violin': () => Violin,
      '/scatterExpression': () => ScatterExpression,
      '/scatterDensity': () => ScatterDensity,
    },
  };
});

export const useApp = sdkPlugin.useApp;
