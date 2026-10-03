The terminal is a place where you type commands instead of clicking. Git is a terminal program, so this is where you will talk to it. Four commands are enough to move around.

- `pwd` prints the folder you are in, called the current folder.
- `ls` lists the files and folders in it. `ls -a` also shows hidden ones, whose names start with a dot.
- `cd notes` moves into the folder called `notes`.
- `cd ..` moves up, to the folder that contains the one you are in.

Type a command and press Enter. The files panel follows you as you move.

## Try it

1. Find out where you are.
2. List what is in this folder, then move into `notes`.
3. List everything in `notes`, including hidden files. One file is hidden. Answer the question with its name.
4. Move back up, then into `photos`.

## What just happened

You moved around a folder tree without a mouse. Every git command you run later acts on the folder you are in, so `pwd` is the first thing to check when something looks wrong.
