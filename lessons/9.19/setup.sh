#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo report
write report.py \
  "import csv" \
  "" \
  "" \
  "def load(path):" \
  "    with open(path) as f:" \
  "        return [row for row in csv.DictReader(f)]" \
  "" \
  "" \
  "def total(rows):" \
  "    total = 0" \
  "    for row in rows:" \
  "        total += float(row['amount'])" \
  "    return total" \
  "" \
  "" \
  "def fmt(value):" \
  "    return '%.2f' % value" \
  "" \
  "" \
  "def count(rows):" \
  "    return len(rows)" \
  "" \
  "" \
  "def smallest(rows):" \
  "    return min(float(row['amount']) for row in rows)" \
  "" \
  "" \
  "def average(rows):" \
  "    if not rows:" \
  "        return 0" \
  "    avg = total(rows) / count(rows)" \
  "    return round(avg, 1)" \
  "" \
  "" \
  "def largest(rows):" \
  "    return max(float(row['amount']) for row in rows)" \
  "" \
  "" \
  "def main(path):" \
  "    rows = load(path)" \
  "    print('total', fmt(total(rows)))" \
  "    print('average', fmt(average(rows)))"
commit "Add report script"
mark base

# Four separate edits: two rounding fixes and two temporary DEBUG prints.
write report.py \
  "import csv" \
  "" \
  "" \
  "def load(path):" \
  "    with open(path) as f:" \
  "        return [row for row in csv.DictReader(f)]" \
  "" \
  "" \
  "def total(rows):" \
  "    total = 0.0" \
  "    for row in rows:" \
  "        total += float(row['amount'])" \
  "    return total" \
  "" \
  "" \
  "def fmt(value):" \
  "    return '%.2f' % value" \
  "" \
  "" \
  "def count(rows):" \
  "    print('DEBUG count', len(rows))" \
  "    return len(rows)" \
  "" \
  "" \
  "def smallest(rows):" \
  "    return min(float(row['amount']) for row in rows)" \
  "" \
  "" \
  "def average(rows):" \
  "    if not rows:" \
  "        return 0" \
  "    avg = total(rows) / count(rows)" \
  "    return round(avg, 2)" \
  "" \
  "" \
  "def largest(rows):" \
  "    return max(float(row['amount']) for row in rows)" \
  "" \
  "" \
  "def main(path):" \
  "    rows = load(path)" \
  "    print('DEBUG rows', rows)" \
  "    print('total', fmt(total(rows)))" \
  "    print('average', fmt(average(rows)))"
