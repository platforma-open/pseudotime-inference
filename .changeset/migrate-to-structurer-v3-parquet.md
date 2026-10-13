---
'@platforma-open/milaboratories.pseudotime-inference.model': minor
'@platforma-open/milaboratories.pseudotime-inference.ui': minor
'@platforma-open/milaboratories.pseudotime-inference.workflow': patch
'@platforma-open/milaboratories.pseudotime-inference.software': patch
'@platforma-open/milaboratories.pseudotime-inference': minor
---

Migrate block onto the structurer (block-tools 2.16.13) with a full SDK upgrade: model and ui-vue 1.84.20, workflow-tengo 6.15.0, tengo-builder 4.1.11, test 1.84.20. Adopts the tool-managed layout, the slim facade, and the mandatory `kind/` package. Its init-params contract is `{ clusterAnnotationRef?, rootCluster? }`.

Migrate the model to `BlockModelV3`, because the 1.84 SDK no longer ships the V1 `BlockModel`. A legacy upgrader merges the saved V1 args and UI state, so existing projects keep their cluster annotation, root cluster and plot settings.

Export the PCA embeddings as Parquet instead of CSV, with their own 32 GiB / 4 CPU budget. The Python tool reads them with `pd.read_parquet`.

Pin the full Python dependency set to the versions the previous release ran, and keep the 3.12.10 runenv build it used, so pseudotime values stay the same.
