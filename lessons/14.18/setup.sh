#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo vault
at 2024-10-01T08:00
write README.md "# Seed vault" "" "Inventory of saved seeds."
commit "Add README"
write ledger.txt "beans: 40 seeds" "squash: 12 seeds"
commit "Start the ledger"
write docs/policy.md "# Policy" "" "Swap half of every batch with a neighbour."
commit "Add swap policy"
mark v1
tick
git tag -a v1.0 -m "First inventory"
append ledger.txt "sunflower: 25 seeds"
commit "Add sunflowers to ledger"
mark tip

# A healthy copy taken before anything went wrong.
git clone -q --no-hardlinks "$LESSON_ROOT/vault" "$LESSON_ROOT/backup"

# 1. A commit that was never finished: the tree was written, the commit was not.
write plans/launch.md "# Launch plan" "" "Open the vault to the public in spring."
git add plans/launch.md
git write-tree >/dev/null
git rm -q --cached -r plans
rm -rf plans

# 2. A branch that is a symbolic ref to a branch that no longer exists.
printf 'ref: refs/heads/releases/1.0\n' >.git/refs/heads/release

# 3. The object holding the ledger is damaged.
blob=$(git rev-parse HEAD:ledger.txt)
obj=".git/objects/${blob:0:2}/${blob:2}"
rm -f "$obj"
printf 'garbage\n' >"$obj"
