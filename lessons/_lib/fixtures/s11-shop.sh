# Fixture for section 11 (detective work): the "pricer" repo, a small Python
# library that prices a shopping cart. Source this AFTER setup-lib.sh. It
# builds $LESSON_ROOT/pricer and leaves the shell inside it, on main, clean.
#
# Used by 11.01, 11.02, 11.03, 11.04, 11.08, 11.09, 11.10, 11.11, 11.12.
#
# Messages that would give a lesson's answer away are deliberately neutral
# (legacy-add, legacy-remove, usage-rename, summer-add).
#
# Shape of main (oldest first; dates are 10:00 UTC on the day shown):
#   skeleton        Alex    02-05  Add pricer skeleton               cart.py: TAX_RATE, total, format_price
#   usage-add       Sam     02-06  Add usage notes                   USAGE.md
#   tests-add       Priya   02-07  Add tests for total
#   config-add      Jordan  02-08  Add default config                config/defaults.toml
#   legacy-add      Alex    02-09  Accept prices stored as strings   adds legacy_total; <- tag v0.1
#   vat-add         Sam     02-12  Add VAT helper                    pricer/vat.py
#   discounts-add   Priya   02-13  Add discount codes                discounts.py, apply_discount in cart.py
#   usage-rename    Jordan  02-14  Reorganize the docs               USAGE.md -> docs/usage.md
#   legacy-remove   Alex    02-15  Clean up cart.py                  removes legacy_total
#   total-round     Sam     02-16  Round totals to cents             <- tag v0.2, branch release/0.2
#   summer-add      Priya   02-19  Extend the discount table         adds "SUMMER": 15
#   reformat        Jordan  02-20  Reformat discounts table          whitespace only
#   bug             Alex    02-21  Tidy tax constants                TAX_RATE 0.20 -> 0.02 (planted bug)
#   vat-rename      Sam     02-22  Rename vat.py to tax.py
#   usage-edit      Priya   02-23  Expand usage docs
#   config-delete   Jordan  02-26  Remove unused config file         deletes config/defaults.toml
#   cli-merge       Alex    02-27  Merge branch 'feature/cli'        (cli-1, cli-2 by Alex on feature/cli)
#   move-format     Sam     02-28  Move format_price to format.py    <- tag v1.0 (annotated)
#   changelog       Priya   03-04  Add changelog
#   fix             Jordan  03-05  Fix tax rate                      TAX_RATE back to 0.20
#   total-discount  Alex    03-06  Apply discount before tax         total() changed
#   total-empty     Sam     03-07  Handle empty carts in total       total() changed
#   changelog-11    Priya   03-08  Update changelog for 1.1          <- tag v1.1 (annotated)
#   autumn-add      Jordan  03-12  Add autumn discount code
#   usage-codes     Alex    03-13  Document discount codes
#   tests-discounts Sam     03-14  Add tests for discounts
#   readme          Priya   03-15  Clarify README
#   bump            Jordan  03-19  Bump version to 1.2.0-dev         <- HEAD, main
#
# Other refs:
#   release/0.2        v0.2 + "Fix typo in usage docs" (Jordan, 03-05)   does NOT contain fix
#   feature/cli        merged into main at cli-merge                      does NOT contain fix
#   topic/rounding-v1  3 commits by Priya on top of v1.0 (r1-1, r1-2, r1-3)
#   topic/rounding     the same series rebased onto main: r2-1 same, r2-2 changed, third commit dropped
#
# Commit counts on main (30 incl. the merge): Alex 9, Sam 7, Priya 7, Jordan 7.
# Since 2024-03-10 on main: Jordan 2, Alex 1, Sam 1, Priya 1. No commit falls
# on 03-09..03-11, so --since=2024-03-10 is stable in every time zone.

new_repo pricer

# cart.py versions. Keep total() in this file for the whole history (log -L
# does not follow renames).
cart_py() {
  case "$1" in
    v1)
      write pricer/cart.py \
        'TAX_RATE = 0.20' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return subtotal * (1 + TAX_RATE)' \
        '' \
        '' \
        'def format_price(cents):' \
        '    euros = cents // 100' \
        '    rest = cents % 100' \
        '    return f"{euros}.{rest:02d} EUR"'
      ;;
    legacy)
      cart_py v1
      append pricer/cart.py \
        '' \
        '' \
        'def legacy_total(items):' \
        '    # old carts stored prices as strings' \
        '    return total([float(p) for p in items])'
      ;;
    discounts)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return subtotal * (1 + TAX_RATE)' \
        '' \
        '' \
        'def format_price(cents):' \
        '    euros = cents // 100' \
        '    rest = cents % 100' \
        '    return f"{euros}.{rest:02d} EUR"' \
        '' \
        '' \
        'def legacy_total(items):' \
        '    # old carts stored prices as strings' \
        '    return total([float(p) for p in items])' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    nolegacy)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return subtotal * (1 + TAX_RATE)' \
        '' \
        '' \
        'def format_price(cents):' \
        '    euros = cents // 100' \
        '    rest = cents % 100' \
        '    return f"{euros}.{rest:02d} EUR"' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    round)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def format_price(cents):' \
        '    euros = cents // 100' \
        '    rest = cents % 100' \
        '    return f"{euros}.{rest:02d} EUR"' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    bug)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.02  # standard VAT' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def format_price(cents):' \
        '    euros = cents // 100' \
        '    rest = cents % 100' \
        '    return f"{euros}.{rest:02d} EUR"' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    moved)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.02  # standard VAT' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    fixed)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20  # standard VAT' \
        '' \
        '' \
        'def total(items):' \
        '    subtotal = sum(items)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    discount-first)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20  # standard VAT' \
        '' \
        '' \
        'def total(items, code=None):' \
        '    subtotal = sum(items)' \
        '    if code:' \
        '        subtotal = apply_discount(subtotal, code)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
    empty)
      write pricer/cart.py \
        'from pricer.discounts import CODES' \
        '' \
        'TAX_RATE = 0.20  # standard VAT' \
        '' \
        '' \
        'def total(items, code=None):' \
        '    if not items:' \
        '        return 0.0' \
        '    subtotal = sum(items)' \
        '    if code:' \
        '        subtotal = apply_discount(subtotal, code)' \
        '    return round(subtotal * (1 + TAX_RATE), 2)' \
        '' \
        '' \
        'def apply_discount(amount, code):' \
        '    percent = CODES.get(code, 0)' \
        '    return amount * (100 - percent) / 100'
      ;;
  esac
}

as alex
at 2024-02-05T09:00
write README.md "# pricer" "" "Price a shopping cart: totals, tax and discount codes."
write pricer/__init__.py '__version__ = "0.1.0"'
cart_py v1
commit "Add pricer skeleton"
mark skeleton

as sam
at 2024-02-06T09:00
write USAGE.md "# Usage" "" "    from pricer.cart import total" "    total([199, 250])"
commit "Add usage notes"
mark usage-add

as priya
at 2024-02-07T09:00
write tests/test_cart.py 'from pricer.cart import total' '' '' 'def test_total_adds_tax():' '    assert total([100]) == 120.0'
commit "Add tests for total"
mark tests-add

as jordan
at 2024-02-08T09:00
write config/defaults.toml '[pricer]' 'currency = "EUR"' 'tax_rate = 0.20'
commit "Add default config"
mark config-add

as alex
at 2024-02-09T09:00
cart_py legacy
commit "Accept prices stored as strings"
mark legacy-add
git tag v0.1

as sam
at 2024-02-12T09:00
write pricer/vat.py 'from pricer.cart import TAX_RATE' '' '' 'def vat_amount(subtotal):' '    return round(subtotal * TAX_RATE, 2)'
commit "Add VAT helper"
mark vat-add

as priya
at 2024-02-13T09:00
write pricer/discounts.py 'CODES = {' '  "SPRING": 10,' '  "WINTER": 5,' '}'
cart_py discounts
commit "Add discount codes"
mark discounts-add

as jordan
at 2024-02-14T09:00
mkdir -p docs
git mv USAGE.md docs/usage.md
commit "Reorganize the docs"
mark usage-rename

as alex
at 2024-02-15T09:00
cart_py nolegacy
commit "Clean up cart.py"
mark legacy-remove

as sam
at 2024-02-16T09:00
cart_py round
commit "Round totals to cents"
mark total-round
git tag v0.2
git branch release/0.2

as priya
at 2024-02-19T09:00
write pricer/discounts.py 'CODES = {' '  "SPRING": 10,' '  "WINTER": 5,' '  "SUMMER": 15,' '}'
commit "Extend the discount table"
mark summer-add

as jordan
at 2024-02-20T09:00
write pricer/discounts.py 'CODES = {' '    "SPRING": 10,' '    "WINTER": 5,' '    "SUMMER": 15,' '}'
commit "Reformat discounts table"
mark reformat

as alex
at 2024-02-21T09:00
cart_py bug
commit "Tidy tax constants"
mark bug

as sam
at 2024-02-22T09:00
git mv pricer/vat.py pricer/tax.py
commit "Rename vat.py to tax.py"
mark vat-rename

as priya
at 2024-02-23T09:00
write docs/usage.md "# Usage" "" "    from pricer.cart import total" "    total([199, 250])" "" "Prices are in cents. The result includes tax."
commit "Expand usage docs"
mark usage-edit

as jordan
at 2024-02-26T09:00
git rm -q config/defaults.toml
commit "Remove unused config file"
mark config-delete

# feature/cli: two commits by Alex, merged with a merge commit.
as alex
git switch -q -c feature/cli
at 2024-02-26T13:00
write pricer/cli.py 'import sys' '' 'from pricer.cart import total' '' '' 'def main(argv):' '    items = [int(a) for a in argv]' '    print(total(items))' '' '' 'if __name__ == "__main__":' '    main(sys.argv[1:])'
commit "Add CLI entry point"
mark cli-1
at 2024-02-26T15:00
write pricer/cli.py 'import sys' '' 'from pricer.cart import total' '' '' 'def main(argv):' '    code = None' '    if argv and argv[0].startswith("--code="):' '        code = argv.pop(0).split("=", 1)[1]' '    items = [int(a) for a in argv]' '    print(total(items), code or "")' '' '' 'if __name__ == "__main__":' '    main(sys.argv[1:])'
commit "Add --code option to the CLI"
mark cli-2
git switch -q main
at 2024-02-27T09:00
tick
git merge -q --no-ff feature/cli -m "Merge branch 'feature/cli'" >/dev/null
mark cli-merge

as sam
at 2024-02-28T09:00
cart_py moved
write pricer/format.py 'def format_price(cents):' '    euros = cents // 100' '    rest = cents % 100' '    return f"{euros}.{rest:02d} EUR"'
commit "Move format_price to format.py"
mark move-format
tick
git tag -a v1.0 -m "Release 1.0"

as priya
at 2024-03-04T09:00
write CHANGELOG.md "# Changelog" "" "## 1.0" "- Discount codes" "- Command-line interface"
commit "Add changelog"
mark changelog

as jordan
at 2024-03-05T09:00
cart_py fixed
commit "Fix tax rate"
mark fix

as alex
at 2024-03-06T09:00
cart_py discount-first
commit "Apply discount before tax"
mark total-discount

as sam
at 2024-03-07T09:00
cart_py empty
commit "Handle empty carts in total"
mark total-empty

as priya
at 2024-03-08T09:00
write CHANGELOG.md "# Changelog" "" "## 1.1" "- Fix the tax rate (it was 2% instead of 20%)" "- Discounts apply before tax" "- Empty carts total 0.0" "" "## 1.0" "- Discount codes" "- Command-line interface"
commit "Update changelog for 1.1"
mark changelog-11
tick
git tag -a v1.1 -m "Release 1.1"

as jordan
at 2024-03-12T09:00
write pricer/discounts.py 'CODES = {' '    "SPRING": 10,' '    "WINTER": 5,' '    "SUMMER": 15,' '    "AUTUMN": 10,' '}'
commit "Add autumn discount code"
mark autumn-add

as alex
at 2024-03-13T09:00
append docs/usage.md "" "## Discount codes" "" "Pass a code as the second argument: total([199, 250], \"SPRING\")."
commit "Document discount codes"
mark usage-codes

as sam
at 2024-03-14T09:00
write tests/test_discounts.py 'from pricer.cart import apply_discount' '' '' 'def test_spring_code():' '    assert apply_discount(1000, "SPRING") == 900.0'
commit "Add tests for discounts"
mark tests-discounts

as priya
at 2024-03-15T09:00
write README.md "# pricer" "" "Price a shopping cart: totals, tax and discount codes." "" "See docs/usage.md to get started."
commit "Clarify README"
mark readme

as jordan
at 2024-03-19T09:00
write pricer/__init__.py '__version__ = "1.2.0-dev"'
commit "Bump version to 1.2.0-dev"
mark bump

# release/0.2: one maintenance commit on top of v0.2.
as jordan
git switch -q release/0.2
at 2024-03-05T13:00
write docs/usage.md "# Usage" "" "    from pricer.cart import total" "    total([199, 250])" "" "Prices are in cents."
commit "Fix typo in usage docs"
mark release-02-fix

# topic/rounding-v1: the original series, on top of v1.0.
as priya
git switch -q -c topic/rounding-v1 v1.0
at 2024-03-08T13:00
write pricer/format.py 'def format_price(cents):' '    cents = int(cents + 0.5)' '    euros = cents // 100' '    rest = cents % 100' '    return f"{euros}.{rest:02d} EUR"'
commit "Round half up in format_price"
mark r1-1
write tests/test_format.py 'from pricer.format import format_price' '' '' 'def test_rounds_half_up():' '    assert format_price(199.5) == "2.00 EUR"'
commit "Add rounding tests"
mark r1-2
append docs/usage.md "" "Fractions of a cent are rounded half up."
commit "Note rounding in docs"
mark r1-3

# topic/rounding: the series after a rebase onto main. The first commit is
# the same change, the second has a different test, the third was dropped.
as priya
git switch -q -c topic/rounding main
at 2024-03-20T09:00
tick
git cherry-pick topic/rounding-v1~2 >/dev/null
mark r2-1
write tests/test_format.py 'from pricer.format import format_price' '' '' 'def test_rounds_half_up():' '    assert format_price(199.5) == "2.00 EUR"' '' '' 'def test_rounds_down():' '    assert format_price(199.4) == "1.99 EUR"'
commit "Add rounding tests"
mark r2-2

git switch -q main
as alex
