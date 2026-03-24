---
title: Contribute
rss_ignore: true
layout: prose
menu:
  main:
    name: Contribute
    weight: 98
---

You can contribute a new dataset directly on GitHub.

Each dataset is a new folder under `content/datasets/` with an `index.md` file.

Example:

```text
content/datasets/escargot/index.md
```

The `index.md` file should follow the template in `archetypes/datasets.md`, which you can find [here](https://github.com/qim-center/data-repository/blob/main/archetypes/datasets.md?plain=1).

## Step-by-step guide

1. Copy the template content from [here](https://github.com/qim-center/data-repository/blob/main/archetypes/datasets.md?plain=1).
2. Go to `content/datasets/` on [GitHub](https://github.com/qim-center/data-repository/tree/main/content/datasets).
3. Click **Add file** -> **Create new file** in the top right.
4. In the filename box, enter:

   ```text
   your-dataset-name/index.md
   ```

5. Paste the template and fill in all fields. In `volumes`, include the URLs to your dataset files. (If you cannot host the data, [contact us](/about/#contact).)
6. Commit changes, create a new branch and start a pull request.
