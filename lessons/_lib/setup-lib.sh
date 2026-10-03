# Canopy lesson setup library. Sourced by setup.sh and actions/*.sh.
# See docs/LESSON_FORMAT.md section 4.

set -euo pipefail

: "${LESSON_ROOT:?LESSON_ROOT not set}"
: "${CANOPY_STATE:=$LESSON_ROOT/.canopy}"
mkdir -p "$CANOPY_STATE"

export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL="${GIT_CONFIG_GLOBAL:-$CANOPY_STATE/setup.gitconfig}"
export GIT_TERMINAL_PROMPT=0
export GIT_PAGER=cat
export GIT_EDITOR=true

# Clock: fixed and advancing, so every learner gets identical hashes.
# Actions continue from where setup left the clock.
if [[ -f "$CANOPY_STATE/clock" ]]; then
  _canopy_t=$(<"$CANOPY_STATE/clock")
else
  _canopy_t=1704103200 # 2024-01-01T10:00:00Z
fi

_canopy_set_clock() {
  printf '%s' "$_canopy_t" >"$CANOPY_STATE/clock"
  export GIT_AUTHOR_DATE="@$_canopy_t +0000"
  export GIT_COMMITTER_DATE="@$_canopy_t +0000"
}

tick() {
  _canopy_t=$((_canopy_t + ${1:-3600}))
  _canopy_set_clock
}

at() {
  _canopy_t=$(date -u -d "$1" +%s 2>/dev/null || date -u -j -f "%Y-%m-%dT%H:%M" "$1" +%s)
  _canopy_set_clock
}

as() {
  local name email
  case "$1" in
    alex) name="Alex Rivera" email="alex@example.com" ;;
    sam) name="Sam Chen" email="sam@example.com" ;;
    priya) name="Priya Patel" email="priya@example.com" ;;
    jordan) name="Jordan Lee" email="jordan@example.com" ;;
    *"<"*">")
      name="${1%% <*}"
      email="${1##*<}"
      email="${email%>}"
      ;;
    *)
      echo "as: unknown author '$1'" >&2
      return 1
      ;;
  esac
  export GIT_AUTHOR_NAME="$name" GIT_AUTHOR_EMAIL="$email"
  export GIT_COMMITTER_NAME="$name" GIT_COMMITTER_EMAIL="$email"
}

as alex
_canopy_set_clock

new_repo() {
  mkdir -p "$LESSON_ROOT/$1"
  git init -q -b main "$LESSON_ROOT/$1"
  cd "$LESSON_ROOT/$1"
}

new_bare() {
  git init -q --bare -b main "$LESSON_ROOT/$1"
}

clone_repo() {
  git clone -q "$LESSON_ROOT/$1" "$LESSON_ROOT/$2" 2>/dev/null
  cd "$LESSON_ROOT/$2"
}

goto() {
  cd "$LESSON_ROOT/$1"
}

write() {
  local path=$1
  shift
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$@" >"$path"
}

append() {
  local path=$1
  shift
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$@" >>"$path"
}

commit() {
  git add -A
  tick
  git commit -q --allow-empty-message -m "$1"
}

commit_file() {
  write "$1" "$2"
  commit "$3"
}

mark() {
  local sha repo
  sha=$(git rev-parse "${2:-HEAD}^{commit}")
  repo=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  repo=${repo#"$LESSON_ROOT"}
  repo=${repo#/}
  printf '%s\t%s\t%s\n' "$1" "${repo:-.}" "$sha" >>"$CANOPY_STATE/marks.tsv"
}

local_config() {
  git config --local "$1" "$2"
}
