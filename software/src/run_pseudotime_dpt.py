import argparse
import pandas as pd
import scanpy as sc

def run_dpt(pca_csv, cluster_csv, out_prefix="output"):
    # Load PCA data
    print("📥 Reading PCA data...")
    pca_df = pd.read_csv(pca_csv)
    pca_df['cell_id'] = pca_df['Sample'].astype(str) + "|" + pca_df['Cell Barcode'].astype(str)

    # Group to handle duplicates
    pca_df_grouped = pca_df.groupby(['cell_id', 'Principal Component Number'])['Principal Component Value'].mean().reset_index()

    # Pivot to matrix: cells x PCs
    print("🔁 Pivoting to PCA matrix...")
    pca_matrix = pca_df_grouped.pivot(index='cell_id', columns='Principal Component Number', values='Principal Component Value')
    pca_matrix.fillna(0, inplace=True)

    # Load clustering data
    print("📥 Reading clustering data...")
    clust_df = pd.read_csv(cluster_csv)
    clust_df['cell_id'] = clust_df['Sample'].astype(str) + "|" + clust_df['Cell Barcode'].astype(str)

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

    args = parser.parse_args()

    run_dpt(args.pca_csv, args.cluster_csv, args.out_prefix)
