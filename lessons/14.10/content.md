`git commit` is a convenience wrapped around five plumbing steps. Doing them once by hand shows that there is nothing else inside.

1. `git hash-object -w <file>`: store the content, get a blob id.
2. `git update-index --add --cacheinfo 100644,<blob>,<path>`: record it in the index.
3. `git write-tree`: turn the index into a tree object, get a tree id.
4. `git commit-tree <tree> -p HEAD -m "<message>"`: write a commit object, get a commit id.
5. `git update-ref refs/heads/main <commit>`: move the branch to it.

## Try it

1. Create `hello.txt` containing `hello from plumbing`.
2. Store it as a blob and keep the id.
3. Add it to the index with `update-index --add --cacheinfo`. List the index: the new entry is there.
4. Write the tree and keep the tree id. List it: the three old entries (`docs` is a tree) plus `hello.txt`.
5. Write the commit with HEAD as parent and a message of your choice. Print the new object with `cat-file -p`.
6. Point `main` at the new commit. Watch the graph grow by one.

## What just happened

The working tree never entered into it after step 1; the commit was built from the index and the object store. Do not use `git add` or `git commit` here: the goal is to reach the same result through the parts they are made of.
