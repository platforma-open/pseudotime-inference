import argparse
import pandas as pd
import scanpy as sc
import numpy as np
from scanpy.tools._draw_graph import _choose_graph, get_init_pos_from_paga
from fa2_modified import ForceAtlas2


def _canon(s: str) -> str:
    return ''.join(ch for ch in s.lower() if ch.isalnum())


def _find_axis(df: pd.DataFrame, preferred: list[str]) -> str:
    cols = [c.strip() for c in df.columns]
    df.columns = cols
    lower_map = {c.lower(): c for c in df.columns}
    canon_map = {_canon(c): c for c in df.columns}
    # direct preferred
    for name in preferred:
        if name in df.columns:
            return name
        if name.lower() in lower_map:
            return lower_map[name.lower()]
    # canonical variants
    for name in preferred:
        cn = _canon(name)
        if cn in canon_map:
            return canon_map[cn]
    # heuristics
    if preferred and _canon(preferred[0]).startswith('sample'):
        for k, orig in canon_map.items():
            if k.startswith('sample'):
                return orig
    if preferred and 'cell' in _canon(preferred[0]):
        for k, orig in canon_map.items():
            if 'cell' in k and ('id' in k or 'barcode' in k):
                return orig
    raise KeyError(f"Missing axis {preferred} in columns: {list(df.columns)}")


def _detect_pc_value_col(df: pd.DataFrame) -> str:
    if 'Principal Component Value' in df.columns:
        return 'Principal Component Value'
    if 'Principal Component Value - Harmony corrected' in df.columns:
        return 'Principal Component Value - Harmony corrected'
    raise KeyError("PCA CSV must contain 'Principal Component Value' or 'Principal Component Value - Harmony corrected'.")


def draw_graph_fa2_modified(
    adata,
    layout='fa',
    init_pos: str | bool | None = None,
    root: int | None = None,
    random_state=0,
    adjacency=None,
    key_added: str | None = None,
    neighbors_key: str | None = None,
    obsp: str | None = None,
    copy: bool = False,
    **kwargs,
):
    """
    Modified version of scanpy's draw_graph that uses fa2_modified instead of fa2.
    This function replicates the behavior of sc.tl.draw_graph but uses fa2_modified.
    """
    import warnings
    
    if layout != 'fa2_modified':
        # For non-FA layouts, fall back to original scanpy function
        return sc.tl.draw_graph(
            adata, layout=layout, init_pos=init_pos, root=root,
            random_state=random_state, adjacency=adjacency,
            key_added=key_added, neighbors_key=neighbors_key, obsp=obsp,
            copy=copy, **kwargs
        )
    
    # Get adjacency matrix
    adjacency = _choose_graph(adata, obsp, neighbors_key)
    
    # Get initial coordinates
    if init_pos in adata.obsm.keys():
        init_coords = adata.obsm[init_pos]
    elif init_pos == "paga" or init_pos:
        init_coords = get_init_pos_from_paga(
            adata,
            adjacency,
            random_state=random_state,
            neighbors_key=neighbors_key,
            obsp=obsp,
        )
    else:
        np.random.seed(random_state)
        init_coords = np.random.random((adjacency.shape[0], 2))
    
    # Create ForceAtlas2 instance with fa2_modified
    forceatlas2 = ForceAtlas2(
        # Behavior alternatives
        outboundAttractionDistribution=False,  # Dissuade hubs
        linLogMode=False,  # NOT IMPLEMENTED
        adjustSizes=False,  # Prevent overlap (NOT IMPLEMENTED)
        edgeWeightInfluence=1.0,
        # Performance
        jitterTolerance=1.0,  # Tolerance
        barnesHutOptimize=True,
        barnesHutTheta=1.2,
        multiThreaded=False,  # NOT IMPLEMENTED
        # Tuning
        scalingRatio=2.0,
        strongGravityMode=False,
        gravity=1.0,
        # Log
        verbose=False,
    )
    
    # Run ForceAtlas2
    positions = forceatlas2.forceatlas2(
        adjacency, pos=init_coords, iterations=500
    )
    positions = np.array(positions)
    
    # Store results in adata
    adata.uns["draw_graph"] = {}
    adata.uns["draw_graph"]["params"] = dict(layout=layout, random_state=random_state)
    key_added = f"X_draw_graph_{key_added_ext or layout}"
    
    adata.obsm[key_added] = positions
    
    return adata if copy else None


def run_dpt(pca_csv, cluster_csv, umap_csv, out_prefix="output", rev: str | None = None, root_cluster: str | None = None):
    # Load PCA data
    print("📥 Reading PCA data...")
    pca_df = pd.read_csv(pca_csv)
    sample_col_pca = _find_axis(pca_df, ['Sample', 'SampleId'])
    cell_col_pca = _find_axis(pca_df, ['Cell Barcode', 'Cell ID', 'CellId'])
    pc_value_col = _detect_pc_value_col(pca_df)
    print(f"✅ PCA axes: Sample='{sample_col_pca}', Cell='{cell_col_pca}', Value='{pc_value_col}' (rev={rev})")

    pca_df['cell_id'] = pca_df[sample_col_pca].astype(str) + "|" + pca_df[cell_col_pca].astype(str)

    # Group to handle duplicates
    pca_df_grouped = (
        pca_df.groupby(['cell_id', 'Principal Component Number'])[pc_value_col]
        .mean()
        .reset_index()
    )

    # Pivot to matrix: cells x PCs
    print("🔁 Pivoting to PCA matrix...")
    pca_matrix = pca_df_grouped.pivot(index='cell_id', columns='Principal Component Number', values=pc_value_col)
    pca_matrix.fillna(0, inplace=True)

    # Load UMAP data
    print("📥 Reading UMAP data...")
    umap_df = pd.read_csv(umap_csv)
    sample_col_umap = _find_axis(umap_df, ['Sample', 'SampleId'])
    cell_col_umap = _find_axis(umap_df, ['Cell Barcode', 'Cell ID', 'CellId'])
    umap1_col = _find_axis(umap_df, ['UMAP Dim1', 'UMAP1', 'umap1'])
    umap2_col = _find_axis(umap_df, ['UMAP Dim2', 'UMAP2', 'umap2'])
    print(f"✅ UMAP axes: Sample='{sample_col_umap}', Cell='{cell_col_umap}', UMAP1='{umap1_col}', UMAP2='{umap2_col}' (rev={rev})")

    umap_df['cell_id'] = umap_df[sample_col_umap].astype(str) + "|" + umap_df[cell_col_umap].astype(str)
    umap_df = umap_df[['cell_id', umap1_col, umap2_col]].drop_duplicates()
    umap_df.set_index('cell_id', inplace=True)

    # Load clustering data
    print("📥 Reading clustering data...")
    clust_df = pd.read_csv(cluster_csv)
    sample_col_clu = _find_axis(clust_df, ['Sample', 'SampleId'])
    cell_col_clu = _find_axis(clust_df, ['Cell Barcode', 'Cell ID', 'CellId'])
    print(f"✅ Cluster axes: Sample='{sample_col_clu}', Cell='{cell_col_clu}' (rev={rev})")
    clust_df['cell_id'] = clust_df[sample_col_clu].astype(str) + "|" + clust_df[cell_col_clu].astype(str)

    # Automatically use the third column (first after Sample and Cell Barcode)
    leiden_column = clust_df.columns[2]
    print(f"🔍 Using clustering column: {leiden_column}")

    clust_df = clust_df[['cell_id', leiden_column]].drop_duplicates()
    clust_df.set_index('cell_id', inplace=True)

    # Merge
    print("🔗 Merging PCA, UMAP, and clusters...")
    common_cells = pca_matrix.index.intersection(clust_df.index).intersection(umap_df.index)
    if len(common_cells) == 0:
        raise ValueError("❌ No overlapping cells found between PCA, UMAP, and cluster files.")
    
    adata = sc.AnnData(X=pca_matrix.loc[common_cells].values)
    adata.obs_names = pca_matrix.loc[common_cells].index
    adata.obsm['X_pca'] = pca_matrix.loc[common_cells].values
    adata.obsm['X_umap'] = umap_df.loc[common_cells][[umap1_col, umap2_col]].values
    adata.obs['leiden'] = clust_df.loc[common_cells][leiden_column].astype(str).values

    # Neighbors
    print("📉 Computing neighbors...")
    sc.pp.neighbors(adata, use_rep='X_pca')

    # PAGA tree
    print("⏳ Running PAGA pseudotime inference using Leiden clusters as groups...")
    sc.tl.paga(adata, groups='leiden')
    # We need the following command to create the PAGA graph  and save the node 
    # positions in adata.uns['paga']['pos'] (needed to draw_graph)
    _ = sc.pl.paga(adata, color='leiden', add_pos=True, show=False)
    # Recompute the embedding using PAGA-initialization
    # fa2 package is very hard to install, so we use instead fa2_modified and a modified function to draw_graph
    print("📊 Drawing PAGA graph...")
    draw_graph_fa2_modified(adata, layout='fa2_modified', init_pos='paga')
    # The positions of the PAGA nodes (one per cluster/group)
    # adata.uns['paga']['pos']

    # Root cell selection
    print("🧭 Selecting root cell...")
    # By default, the root cell is the one with the lowest PCA value for the first PC
    # Get it from all cells
    if root_cluster is None:
        adata.uns['iroot'] = adata.obsm['X_pca'][:, 0].argmin()
    # Otherwise, get it from the root cluster
    else:
        indices_in_cluster = np.flatnonzero(adata.obs['leiden'] == root_cluster)
        pc1_in_cluster = adata.obsm['X_pca'][indices_in_cluster, 0]
        adata.uns['iroot'] = indices_in_cluster[pc1_in_cluster.argmin()]

    # Pseudotime calculation
    print("⏳ Running DPT pseudotime inference...")
    # DPT uses the connectivity information from the PAGA graph if it exists
    sc.tl.diffmap(adata)
    sc.tl.dpt(adata)

    # Measure cel density
    sc.tl.embedding_density(adata)

    # Split composite ID back into Sample / Cell Barcode
    print("💾 Saving output...")
    adata.obs[['Sample', 'Cell Barcode']] = pd.Series(adata.obs_names).str.split('|', expand=True).values
    output_df = adata.obs[['Sample', 'Cell Barcode', 'dpt_pseudotime']]

    # Store pseudotime data
    pseudotime_file = f"{out_prefix}_pseudotime.csv"
    output_df.to_csv(pseudotime_file, index=False)
    print(f"✅ Pseudotime CSV saved: {pseudotime_file}")

    # Store cell density
    umap_density_file = f"{out_prefix}_umap_density.csv"
    output_df = adata.obs[['Sample', 'Cell Barcode', 'umap_density']]
    # Add a cell density of one per pseudotime value
    output_df.to_csv(umap_density_file, index=False)
    print(f"✅ Cell density CSV saved: {umap_density_file}")

    # Store PAGA graph
    df_t = pd.DataFrame([])
    df_t[['Sample', 'Cell Barcode']] = pd.Series(adata.obs_names).str.split('|', expand=True).values
    df_t['PAGA1'] = adata.obsm['X_draw_graph_fr'][:, 0]
    df_t['PAGA2'] = adata.obsm['X_draw_graph_fr'][:, 1]
    df_t.to_csv(f"paga_graph.csv", index=False)
    print(f"✅ PAGA graph CSV saved: paga_graph.csv")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run pseudotime inference using Scanpy + DPT from PCA embeddings and clusters.")
    parser.add_argument('--pca_csv', required=True, help='CSV file with PCA data.')
    parser.add_argument('--cluster_csv', required=True, help='CSV file with Leiden clusters.')
    parser.add_argument('--umap_csv', required=True, help='CSV file with UMAP coordinates.')
    parser.add_argument('--out_prefix', default='output', help='Prefix for output files.')
    parser.add_argument('--rev', required=False, help='Cache-busting revision token.')
    parser.add_argument('--root_cluster', required=False, help='Root cluster to use for DPT.')

    args = parser.parse_args()

    run_dpt(args.pca_csv, args.cluster_csv, args.umap_csv, args.out_prefix, args.rev, args.root_cluster)
