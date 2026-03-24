---
title: OME-Zarr Download Guide
rss_ignore: true
layout: prose
menu:
  main:
    name: OME-Zarr guide
    weight: 98
---

This guide shows an easy way to download OME-Zarr datasets from the QIM data repository and other sources using Python and the `qim3d` library.

## Step 1: Install qim3d

The official `qim3d` README recommends this setup:

```bash
conda create -n qim3d python=3.11
conda activate qim3d
pip install qim3d
```

Important: activate the environment each time before using `qim3d`:

```bash
conda activate qim3d
```

## Step 2a: Download using the qim3d.io.Downloader()

This codeblock downloads the Escargot OME-Zarr file into a local `downloads` folder.

Ome-Zarr can be large and downloads can take a long time. Keep the process running until completion.

```python
import qim3d

downloader = qim3d.io.Downloader()

escargot_path = downloader(
    url="https://platform.qim.dk/qim-public/escargot/escargot.zarr",
    output_dir="downloads",
    load_file=False,
)

print("Downloaded to:", escargot_path)
```

## Step 2b: Download and explore the data using qim3d

`virtual_stack=True` is recommended for larger datasets because it avoids loading everything into RAM immediately, and uses a `dask.Array`.

The loaded scale can also be configured, by default it loads the highest definition level. Look at the [qim3d documentation](https://docs.qim.dk/qim3d/doc/data_handling/io/#qim3d.io.Downloader.__call__) for more details.

```python
import qim3d

downloader = qim3d.io.Downloader()

escargot = downloader(
    url="https://platform.qim.dk/qim-public/escargot/escargot.zarr",
    output_dir="downloads",
    load_file=True,
    virtual_stack=True,
)

print(type(escargot))
print(escargot.shape)
```
