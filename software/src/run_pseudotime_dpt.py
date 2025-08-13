import argparse
import pandas as pd
import scanpy as sc


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


def run_dpt(pca_csv, cluster_csv, out_prefix="output", rev: str | None = None):
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
    print("🔗 Merging PCA and clusters...")
    common_cells = pca_matrix.index.intersection(clust_df.index)
    if len(common_cells) == 0:
        raise ValueError("❌ No overlapping cells found between PCA and cluster files.")
    
    adata = sc.AnnData(X=pca_matrix.loc[common_cells].values)
    adata.obs_names = pca_matrix.loc[common_cells].index
    adata.obsm['X_pca'] = pca_matrix.loc[common_cells].values
    adata.obs['leiden'] = clust_df.loc[common_cells][leiden_column].astype(str).values

    # Neighbors + DPT
    print("📉 Computing neighbors...")
    sc.pp.neighbors(adata, use_rep='X_pca')

    print("🧭 Selecting root cell...")
    adata.uns['iroot'] = adata.obsm['X_pca'][:, 0].argmin()

    print("⏳ Running DPT pseudotime inference...")
    sc.tl.dpt(adata)

    # Split composite ID back into Sample / Cell Barcode
    print("💾 Saving output...")
    adata.obs[['Sample', 'Cell Barcode']] = pd.Series(adata.obs_names).str.split('|', expand=True).values
    output_df = adata.obs[['Sample', 'Cell Barcode', 'dpt_pseudotime']]
    
    pseudotime_file = f"{out_prefix}_pseudotime.csv"
    output_df.to_csv(pseudotime_file, index=False)
    print(f"✅ Pseudotime CSV saved: {pseudotime_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run pseudotime inference using Scanpy + DPT from PCA embeddings and clusters.")
    parser.add_argument('--pca_csv', required=True, help='CSV file with PCA data.')
    parser.add_argument('--cluster_csv', required=True, help='CSV file with Leiden clusters.')
    parser.add_argument('--out_prefix', default='output', help='Prefix for output files.')
    parser.add_argument('--rev', required=False, help='Cache-busting revision token.')

    args = parser.parse_args()

    run_dpt(args.pca_csv, args.cluster_csv, args.out_prefix, args.rev)
