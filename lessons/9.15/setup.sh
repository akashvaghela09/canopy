#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo parser
write README.md "# parser"
commit "Add project skeleton"
mark base
write parser.py "def parse(tokens):" "    return list(tokens)"
commit "Add paser module"
mark c2
write tokenizer.py "def tokenize(text):" "    return text.split()"
commit "Add tokenizer"
mark c3
write test_parser.py "from parser import parse" "assert parse(['a']) == ['a']"
commit "Add tests"
mark c4
