#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop-api
at 2024-06-10T09:00
commit_file README.md "# shop-api" "Add README"
commit_file products.py 'PRODUCTS = {}' "Add products"
commit_file cart.py 'CART = []' "Add cart"
mark cart-commit
commit_file orders.py 'ORDERS = []' "Add orders"
mark main-base
write orders.py 'ORDERS = []' 'STATUS = ["new", "paid", "shipped"]'
commit "Add order status"
commit_file shipping.py 'RATES = {"standard": 4.99}' "Add shipping rates"
commit_file webhooks.py 'HOOKS = []' "Add webhooks"
mark main-tip

# feature/login: two commits, later deleted.
git switch -q -c feature/login main~3
at 2024-06-11T09:00
write login.py 'def login(user, pw):' '    return check(user, pw)'
commit "Add login endpoint"
write reset.py 'def reset_password(user):' '    send_mail(user)'
commit "Add password reset"
mark login-tip

# experiment: one commit off an old main.
git switch -q -c experiment main~5
at 2024-06-11T13:00
commit_file experiment.py 'GRAPHQL = True' "Try GraphQL"
mark experiment-tip

# feature/api-v2: three commits off main~2, rebased onto experiment by mistake.
git switch -q -c feature/api-v2 main~2
at 2024-06-12T09:00
commit_file api/v2/__init__.py 'VERSION = 2' "Start API v2"
write api/v2/products.py 'def list_products():' '    return []'
commit "Add v2 product listing"
write api/v2/orders.py 'def list_orders():' '    return []'
commit "Add v2 order listing"
mark api-orig
tick
git rebase -q experiment >/dev/null 2>&1

# Back on main: stash and drop the cart totals, delete the login branch,
# reset main three commits back.
git switch -q main
at 2024-06-12T15:00
write cart.py 'CART = []' '' 'def total(cart):' '    return sum(item["price"] * item["qty"] for item in cart)'
tick
git stash push -q -m "wip: cart totals"
mark stash-commit refs/stash
git stash drop -q
tick
git branch -q -D feature/login
tick
git reset -q --hard HEAD~3
