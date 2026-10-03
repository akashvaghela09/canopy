The `shop` project has four commits on `main` and two side branches someone left behind: `old-banner`, whose work was finished and merged long ago, and `wip`, which holds a real cart page under a meaningless name.

Three pieces of work are starting at once, and each needs its own branch:

- `feature/search` should begin at the commit "Add price list", before the checkout page existed.
- `fix/typo` should begin at "Add checkout page".
- `feature/reviews` should begin at the current tip of `main`.

Each of those branches needs at least one commit of its own; what you write in them is up to you. While you are tidying up: the branch `wip` should be called `feature/cart`, `old-banner` should go, and the current tip of `main` is release 2.0 and wants an annotated tag `v2.0`. `main` itself must not move. Finish on `feature/reviews` with a clean working tree.

The goals in the lesson panel describe the target. The order and the commands are up to you.
