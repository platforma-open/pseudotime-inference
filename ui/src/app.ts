import { model } from '@platforma-open/milaboratories.pseudotime-inference.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import MainPage from './pages/MainPage.vue';
import Violin from './pages/violin.vue';

export const sdkPlugin = defineApp(model, () => {
  return {
    routes: {
      '/': () => MainPage,
      '/violin': () => Violin,
    },
  };
});

export const useApp = sdkPlugin.useApp;
