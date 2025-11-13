# Overview

Calculates pseudotime trajectories from single-cell RNA-seq data to order cells along dynamic biological processes such as differentiation, development, or response to stimuli. The block uses Partition-based Graph Abstraction (PAGA) to construct a graph connecting Leiden clusters based on their similarity, then applies Diffusion Pseudotime (DPT) to assign each cell a pseudotime value representing its position along the inferred trajectory.

The block requires principal component embeddings, Leiden cluster assignments, and UMAP coordinates from upstream Dimensionality Reduction and Leiden Clustering blocks. Root cell selection can be performed automatically (lowest first principal component value) or manually by specifying a root cluster. Results include pseudotime scores for each cell, a PAGA graph showing cluster connectivity, and cell density estimates for visualization. Pseudotime trajectories enable the identification of genes associated with specific developmental stages and the analysis of cellular transitions over time.

The block uses scanpy v1.10.1 for PAGA graph construction and DPT pseudotime calculation. When using this block in your research, cite the scanpy publication (Wolf et al. 2018) and the PAGA publication (Wolf et al. 2019) listed below.

The following publications describe the methodologies used:

> Wolf, F. A., Angerer, P., & Theis, F. J. (2018). SCANPY: large-scale single-cell gene expression data analysis. _Genome Biology_ **19**, 15 (2018). [https://doi.org/10.1186/s13059-017-1382-0](https://doi.org/10.1186/s13059-017-1382-0)

> Wolf, F. A., Hamey, F. K., Plass, M. et al. (2019). PAGA: graph abstraction reconciles clustering with trajectory inference through a topology preserving map of single cells. _Genome Biology_ **20**, 59 (2019). [https://doi.org/10.1186/s13059-019-1663-x](https://doi.org/10.1186/s13059-019-1663-x)
