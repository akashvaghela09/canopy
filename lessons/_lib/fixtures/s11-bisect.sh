# Fixture for lessons 11.05, 11.06 and 11.07 (bisect): the "tally" repo,
# two small bash scripts with 64 commits of history. Source this AFTER
# setup-lib.sh. It builds $LESSON_ROOT/tally and leaves the shell inside
# it, on main, clean. Commits are generated in a loop (dates 5 hours apart
# from 2024-04-01); only the numbered commits below matter.
#
#    1  Add tally script and its test     tally.sh, tests/sum.sh
#    3  Add fmt script                     fmt.sh prints cents as euros (1205 -> 12.05)
#    8  Update changelog for 2.0           <- tag v2.0 (everything works)
#   15  Add --help to tally                harmless change to tally.sh
#   20  Default fmt to zero cents          harmless change to fmt.sh (decoy)
#   30  Start rewriting argument parsing   tally.sh has a syntax error...
#   31  Document the sample data           ...still broken...
#   32  Rename variables in tally          ...still broken (30-32 are untestable)
#   33  Fix unterminated loop in tally     tally.sh works again
#   36  Tidy up the input loop             mark neg-fix (neutral message on purpose):
#                                          "tally.sh -2 5" exits 0 from here on
#   41  Simplify the accumulator loop      mark bug: drops the last argument (2 3 5 -> 5)
#   53  Use printf in fmt                  mark fmt-bug: 1205 -> 12.5
#   58  Add --max option to tally          harmless change to tally.sh
#   60  Add --help to fmt                  harmless change to fmt.sh (decoy, bug kept)
#   64  Update changelog                   <- HEAD, main (mark head)
#
# tests/sum.sh exits 0 when "tally.sh 2 3 5" prints 10. From v2.0 to HEAD a
# bisect for the sum bug tests commits 36, 50, 43, 39, 41, 40 (six steps).
# A bisect for the negative-number fix (old/new) passes through commit 32,
# which cannot be tested.

new_repo tally

tally_v1() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'sum=0' \
    'for n in "$@"; do' \
    '  case "$n" in' \
    '    -*) echo "tally: negative numbers not supported" >&2; exit 1 ;;' \
    '  esac' \
    '  sum=$((sum + n))' \
    'done' \
    'echo "$sum"'
}

tally_help() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally NUMBER..."' \
    '  exit 0' \
    'fi' \
    'sum=0' \
    'for n in "$@"; do' \
    '  case "$n" in' \
    '    -*) echo "tally: negative numbers not supported" >&2; exit 1 ;;' \
    '  esac' \
    '  sum=$((sum + n))' \
    'done' \
    'echo "$sum"'
}

tally_broken() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally NUMBER..."' \
    '  exit 0' \
    'fi' \
    "$1=0" \
    'while [ $# -gt 0 ]; do' \
    '  n=$1; shift' \
    '  case "$n" in' \
    '    -*) echo "tally: negative numbers not supported" >&2; exit 1 ;;' \
    '  esac' \
    "  $1=\$(($1 + n))" \
    "echo \"\$$1\""
}

tally_while() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally NUMBER..."' \
    '  exit 0' \
    'fi' \
    'total=0' \
    'while [ $# -gt 0 ]; do' \
    '  n=$1; shift' \
    '  case "$n" in' \
    '    -*) echo "tally: negative numbers not supported" >&2; exit 1 ;;' \
    '  esac' \
    '  total=$((total + n))' \
    'done' \
    'echo "$total"'
}

tally_negatives() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally NUMBER..."' \
    '  exit 0' \
    'fi' \
    'total=0' \
    'while [ $# -gt 0 ]; do' \
    '  n=$1; shift' \
    '  total=$((total + n))' \
    'done' \
    'echo "$total"'
}

tally_bug() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally NUMBER..."' \
    '  exit 0' \
    'fi' \
    'total=0' \
    'while [ $# -gt 1 ]; do' \
    '  total=$((total + $1))' \
    '  shift' \
    'done' \
    'echo "$total"'
}

tally_max() {
  write tally.sh \
    '#!/usr/bin/env bash' \
    '# tally: add up the numbers given as arguments' \
    'if [ "${1:-}" = "--help" ]; then' \
    '  echo "usage: tally [--max] NUMBER..."' \
    '  exit 0' \
    'fi' \
    'if [ "${1:-}" = "--max" ]; then' \
    '  shift' \
    '  printf "%s\n" "$@" | sort -n | tail -1' \
    '  exit 0' \
    'fi' \
    'total=0' \
    'while [ $# -gt 1 ]; do' \
    '  total=$((total + $1))' \
    '  shift' \
    'done' \
    'echo "$total"'
}

fmt_v1() {
  write fmt.sh \
    '#!/usr/bin/env bash' \
    '# fmt: print cents as euros, e.g. 1205 -> 12.05' \
    'cents=$1' \
    'echo "$((cents / 100)).$(printf "%02d" $((cents % 100)))"'
}

fmt_v2() {
  write fmt.sh \
    '#!/usr/bin/env bash' \
    '# fmt: print cents as euros, e.g. 1205 -> 12.05' \
    '# usage: bash fmt.sh CENTS' \
    'cents=${1:-0}' \
    'echo "$((cents / 100)).$(printf "%02d" $((cents % 100)))"'
}

fmt_bug() {
  write fmt.sh \
    '#!/usr/bin/env bash' \
    '# fmt: print cents as euros, e.g. 1205 -> 12.05' \
    '# usage: bash fmt.sh CENTS' \
    'cents=${1:-0}' \
    'printf "%d.%d\n" $((cents / 100)) $((cents % 100))'
}

fmt_help() {
  write fmt.sh \
    '#!/usr/bin/env bash' \
    '# fmt: print cents as euros, e.g. 1205 -> 12.05' \
    '# usage: bash fmt.sh CENTS' \
    'if [ "${1:-}" = "--help" ]; then echo "usage: fmt CENTS"; exit 0; fi' \
    'cents=${1:-0}' \
    'printf "%d.%d\n" $((cents / 100)) $((cents % 100))'
}

authors=(alex sam priya jordan)
at 2024-04-01T08:00
for i in $(seq 1 64); do
  as "${authors[$((i % 4))]}"
  tick 14400
  week=$(( (i - 1) / 8 + 1 ))
  case $i in
    1)
      write README.md "# tally" "" "Small shell tools for adding up and formatting amounts." "" "    bash tally.sh 2 3 5" "    10"
      tally_v1
      write tests/sum.sh '#!/usr/bin/env bash' '# Exit 0 when tally adds up correctly.' 'cd "$(dirname "$0")/.."' '[ "$(bash tally.sh 2 3 5 2>/dev/null)" = "10" ]'
      write CHANGELOG.md "# Changelog" ""
      msg="Add tally script and its test" ;;
    3) fmt_v1; msg="Add fmt script" ;;
    8) append CHANGELOG.md "## 2.0" "- tally and fmt scripts" ""; msg="Update changelog for 2.0" ;;
    15) tally_help; msg="Add --help to tally" ;;
    20) fmt_v2; msg="Default fmt to zero cents" ;;
    30) tally_broken sum; msg="Start rewriting argument parsing" ;;
    31) append README.md "" "Sample data lives in data/entries.csv."; msg="Document the sample data" ;;
    32) tally_broken total; msg="Rename variables in tally" ;;
    33) tally_while; msg="Fix unterminated loop in tally" ;;
    36) tally_negatives; msg="Tidy up the input loop" ;;
    41) tally_bug; msg="Simplify the accumulator loop" ;;
    53) fmt_bug; msg="Use printf in fmt" ;;
    60) fmt_help; msg="Add --help to fmt" ;;
    58) tally_max; msg="Add --max option to tally" ;;
    64) append CHANGELOG.md "## Unreleased" "- --help and --max for tally" "- negative numbers" ""; msg="Update changelog" ;;
    *)
      case $((i % 5)) in
        0) append data/entries.csv "2024-04-$(printf '%02d' $(( (i % 28) + 1 ))),$(( i * 37 % 500 ))"; msg="Add sample entries" ;;
        1) append data/entries.csv "2024-04-$(printf '%02d' $(( (i % 28) + 1 ))),$(( i * 53 % 500 ))"; msg="Record week $week totals" ;;
        2) append data/entries.csv "2024-04-$(printf '%02d' $(( (i % 28) + 1 ))),$(( i * 71 % 500 ))"; msg="Update sample data" ;;
        3) append CHANGELOG.md "- week $week entries"; msg="Note week $week in changelog" ;;
        4) append data/entries.csv "2024-04-$(printf '%02d' $(( (i % 28) + 1 ))),$(( i * 11 % 500 ))"; msg="Add more sample entries" ;;
      esac ;;
  esac
  commit "$msg"
  case $i in
    8) git tag v2.0; mark v20 ;;
    30) mark broken-start ;;
    36) mark neg-fix ;;
    41) mark bug ;;
    53) mark fmt-bug ;;
    64) mark head ;;
  esac
done

as alex
