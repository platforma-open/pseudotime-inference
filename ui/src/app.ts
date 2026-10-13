import { platforma } from "@platforma-open/milaboratories.pseudotime-inference.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import MainPage from "./pages/MainPage.vue";
import ScatterDensity from "./pages/scatterdensity.vue";
import ScatterExpression from "./pages/scatterplot.vue";
import Violin from "./pages/violin.vue";

export const sdkPlugin = defineAppV3(platforma, () => {
  return {
    routes: {
      "/": () => MainPage,
      "/violin": () => Violin,
      "/scatterExpression": () => ScatterExpression,
      "/scatterDensity": () => ScatterDensity,
    },
  };
});

export const useApp = sdkPlugin.useApp;
