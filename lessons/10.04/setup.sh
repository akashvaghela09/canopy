#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
clone_repo origin.git work
at 2024-04-08T09:00
commit_file README.md "# config-service" "Add README"
at 2024-04-08T11:00
write config.py 'def load(path):' '    return open(path).read()'
commit "Add config loader"
mark loader
at 2024-04-08T14:00
commit_file log.py 'LEVEL = "info"' "Add logging"
mark before
git push -q origin main

# A side branch that diverged before "Add logging", so merging it later
# needs a real merge commit.
git switch -q -c experiment "$(git rev-parse main~1)"
at 2024-04-09T09:00
write config.py 'import yaml' '' 'def load(path):' '    return yaml.safe_load(open(path))'
commit "Try YAML config"
at 2024-04-09T11:00
write nested.py 'def get(cfg, dotted):' '    for key in dotted.split("."):' '        cfg = cfg[key]' '    return cfg'
commit "Parse nested keys"
mark exp-tip
git switch -q main

# Sam pushes two commits while you were busy.
clone_repo origin.git teammate
as sam
at 2024-04-09T13:00
write tests/test_config.py 'from config import load' '' 'def test_load(tmp_path):' '    p = tmp_path / "c.txt"' '    p.write_text("x")' '    assert load(p) == "x"'
commit "Add tests"
at 2024-04-09T15:00
write config.py 'import os' '' 'def load(path):' '    return open(os.path.expanduser(path)).read()'
commit "Fix config path"
mark pushed
git push -q origin main

goto work
as alex
