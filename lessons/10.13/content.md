A rough afternoon in `shop-api`, all in one repo:

- `main` lost its last three commits to a hard reset ("Add order status", "Add shipping rates", "Add webhooks").
- `feature/login` (two commits, ending in "Add password reset") was deleted.
- A stash named "wip: cart totals" with the new `total` function in `cart.py` was dropped.
- `feature/api-v2` was rebased onto `experiment` instead of `main`; the rebase finished.

Put everything back: the three branches at their original tips with their original ids, and the cart-totals work back in the working tree (or back in the stash list). Decide for each item whether the reflog or `fsck` is the way in.
