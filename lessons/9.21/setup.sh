#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo mvc
write app.py "from model import Model" "from view import View" "from controller import Controller"
commit "Add app skeleton"
mark base

write model.py "class Model:" "    def __init__(self):" "        self.items = []" "" "    def add(self, item):" "        self.items.append(item)" "        return None"
commit "Add model"
mark model

write view.py "class View:" "    def render(self, items):" "        for item in items:" "            print('-', item)" "        print('%d item(s)' % len(items))"
commit "Add view"
mark view

write controller.py "class Controller:" "    def __init__(self, model, view):" "        self.model = model" "        self.view = view" "" "    def add(self, item):" "        self.model.add(item)" "        self.view.render(self.model.items)"
commit "Add controller"
mark ctrl

write model.py "class Model:" "    def __init__(self):" "        self.items = []" "" "    def add(self, item):" "        self.items.append(item)" "        return item"
write view.py "class View:" "    def render(self, items):" "        for item in items:" "            print('-', item)" "        print('%d item(s)' % len(items))" "        return len(items)"
write controller.py "class Controller:" "    def __init__(self, model, view):" "        self.model = model" "        self.view = view" "" "    def add(self, item):" "        self.model.add(item)" "        return self.view.render(self.model.items)"
