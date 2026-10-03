# Fixture for lesson 11.13 (boss): the "ledger" repo, a bash script that
# prints the balance of a CSV book, with 27 commits by four authors over
# May 2024. Source this AFTER setup-lib.sh. It builds $LESSON_ROOT/ledger
# and leaves the shell inside it, on main, clean.
#
# Messages of 8, 14 and 18 are neutral on purpose (the boss asks about them).
#
# Numbered commits (the rest are "Record ..." filler appending to book.csv):
#    1  Alex    Add ledger script                 ledger.sh, book.csv, tests/
#    4  Jordan  Add export script                 scripts/export.sh
#    6  Sam     Add project notes                 NOTES.txt
#    8  Jordan  Clean up the repo root            deletes NOTES.txt          (mark notes-delete)
#   10  Sam     Release 2.0                       <- tag v2.0 (balance correct)
#   12  Jordan  Normalize indentation             whitespace-only            (mark indent)
#   14  Sam     Tidy report()                     REGRESSION: cents dropped  (mark bug)
#   16  Jordan  Release 2.1                       <- tag v2.1 (contains the bug)
#   18  Sam     Reorganize scripts                scripts/export.sh -> tools/export-csv.sh (mark export-rename)
#   20  Priya   Fix cents being dropped           (mark fix)
#   22  Sam     Release 2.2                       <- tag v2.2 (contains the fix)
#   24  Jordan  Reformat ledger.sh                whitespace-only, touches the balance line (mark reformat)
#   26  Sam     Release 2.3                       <- tag v2.3
#   27  Priya   Add README badge                  <- HEAD, main
#   maint/2.1: v2.1 + "Pin bash version in README" (Sam). Does not contain the fix.
#
# tests/balance.sh exits 0 when ledger.sh prints "Balance: 12.34" for
# tests/sample.csv. It fails from commit 14 to 19.

new_repo ledger

ledger_sh() {
  # $1 = indent unit, $2 = balance line variant (ok|bug)
  local i=$1 bal
  case $2 in
    ok) bal="balance=\$(printf '%d.%02d' \$((total / 100)) \$((total % 100)))" ;;
    bug) bal="balance=\$((total / 100))" ;;
  esac
  write ledger.sh \
    '#!/usr/bin/env bash' \
    '# ledger: print the balance of a book (date,description,cents)' \
    'book=${1:-book.csv}' \
    '' \
    'report() {' \
    "${i}local total=\$1" \
    "${i}${bal}" \
    "${i}echo \"Balance: \$balance\"" \
    '}' \
    '' \
    'total=0' \
    'while IFS=, read -r date desc cents; do' \
    "${i}[ \"\$date\" = \"date\" ] && continue" \
    "${i}total=\$((total + cents))" \
    'done < "$book"' \
    'report "$total"'
}

authors=(alex sam priya jordan)
at 2024-05-01T08:00
for i in $(seq 1 27); do
  as "${authors[$(( (i - 1) % 4 ))]}"
  tick 18000
  case $i in
    1)
      write README.md "# ledger" "" "Print the balance of a CSV book." "" "    bash ledger.sh book.csv"
      write book.csv "date,description,cents" "2024-05-01,Opening balance,10000"
      write tests/sample.csv "date,description,cents" "2024-05-01,Coffee,-266" "2024-05-01,Refund,1500"
      write tests/balance.sh '#!/usr/bin/env bash' 'cd "$(dirname "$0")/.."' '[ "$(bash ledger.sh tests/sample.csv 2>/dev/null)" = "Balance: 12.34" ]'
      ledger_sh "  " ok
      msg="Add ledger script" ;;
    4) write scripts/export.sh '#!/usr/bin/env bash' '# export the book as tab-separated text' 'tr "," "\t" < "${1:-book.csv}"'; msg="Add export script" ;;
    6) write NOTES.txt "Ideas" "- monthly summaries" "- currency symbols"; msg="Add project notes" ;;
    8) git rm -q NOTES.txt; msg="Clean up the repo root" ;;
    10) append README.md "" "## 2.0" "First tagged release."; msg="Release 2.0" ;;
    12) ledger_sh "    " ok; msg="Normalize indentation" ;;
    14) ledger_sh "    " bug; msg="Tidy report()" ;;
    16) append README.md "" "## 2.1" "Simpler balance output."; msg="Release 2.1" ;;
    18) mkdir -p tools; git mv scripts/export.sh tools/export-csv.sh; msg="Reorganize scripts" ;;
    20) as priya; ledger_sh "    " ok; msg="Fix cents being dropped from the balance" ;;
    22) append README.md "" "## 2.2" "Balances show cents again."; msg="Release 2.2" ;;
    24) ledger_sh "	" ok; msg="Reformat ledger.sh with tabs" ;;
    26) append README.md "" "## 2.3" "Maintenance release."; msg="Release 2.3" ;;
    27) write README.md "# ledger" "" "![tests](badge.svg)" "$(tail -n +2 README.md)"; msg="Add README badge" ;;
    *) append book.csv "2024-05-$(printf '%02d' $i),Expense $i,-$(( i * 131 % 900 + 100 ))"; msg="Record expense $i" ;;
  esac
  commit "$msg"
  case $i in
    8) mark notes-delete ;;
    10) git tag v2.0; mark v20 ;;
    12) mark indent ;;
    14) mark bug ;;
    16) git tag -a v2.1 -m "Release 2.1"; mark v21 ;;
    18) mark export-rename ;;
    20) mark fix ;;
    22) git tag -a v2.2 -m "Release 2.2"; mark v22 ;;
    24) mark reformat ;;
    26) git tag -a v2.3 -m "Release 2.3"; mark v23 ;;
    27) mark head ;;
  esac
done

as sam
git switch -q -c maint/2.1 v2.1
tick 7200
append README.md "" "Requires bash 4 or newer."
commit "Pin bash version in README"
mark maint-tip
git switch -q main
as alex
