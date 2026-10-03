The `vault` repository was handed to you in a bad state. A healthy clone from before the damage is in `../backup`.

What is known:

- A teammate started a "launch plan" commit. The tree was written, but the commit never was. Nothing points at that tree.
- The `release` branch was pointed, by hand, at a branch name that was later deleted. It should mark the same commit as the tag `v1.0`.
- One object in the store is damaged.

Use what this section taught: find every problem with the integrity check, read the raw objects to understand what they are, rebuild the missing commit from the orphaned tree on top of `main` under a branch called `recovered`, repair the broken branch, restore the damaged object from the clone, and leave the integrity check clean. Then answer the two questions about the repository's structure.
