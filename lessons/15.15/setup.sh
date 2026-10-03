#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-22T09:00
write README.md "# Calc" "" "Arithmetic helpers."
write util.py "def add(a, b):" "    return a + b" "" "" "def sub(a, b):" "    return b - a" "" "" "def mul(a, b):" "    return a * b" "" "" "def div(a, b):" "    return a / b"
commit "Add arithmetic helpers"
mark base

git checkout -q -b fix
as sam
write util.py "def add(a, b):" "    return a + b" "" "" "def sub(a, b):" "    return a - b" "" "" "def mul(a, b):" "    return a * b" "" "" "def div(a, b):" "    return a / b"
commit "Fix the argument order in sub"
mark fix

as alex
git checkout -q main
mkdir -p lib
git mv util.py lib/helpers.py
write lib/helpers.py '"""Small arithmetic helpers used across the project.' "" "Every function takes two numbers and returns a number." '"""' "" "" "def add(a, b):" '    """Return the sum of a and b."""' "    return a + b" "" "" "def sub(a, b):" "    return b - a" "" "" "def mul(a, b):" '    """Return the product of a and b."""' "    return a * b" "" "" "def div(a, b):" '    """Return the quotient of a and b.' "" "    Raises ZeroDivisionError when b is zero." '    """' "    return a / b" "" "" "def mean(values):" '    """Return the arithmetic mean of a non-empty list."""' "    return sum(values) / len(values)" "" "" "def clamp(value, low, high):" '    """Clamp value into the closed range [low, high]."""' "    return max(low, min(value, high))"
commit "Move the helpers into lib and document them"
mark main-tip
