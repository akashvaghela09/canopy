A commit message has two parts. The first line is the **subject**: a short summary of 50 characters or fewer, written like an instruction ("Add", "Fix", "Increase", not "Added" or "fixing stuff"). After a blank line comes the **body**: why the change was needed, and anything the change itself cannot say. The body is optional, but it is the part your future self will thank you for.

Two `-m` flags give both; git puts the blank line in for you:

    git commit -m "Increase request timeout to 30s" -m "The payment API often takes 15 to 20 seconds. With a 10 second limit, one checkout in five failed."

## Try it

1. The change to `config.yml` is already staged. Check the status to confirm.
2. Commit it with a subject and a body of your own.
3. Answer the question.

## What just happened

Months from now, the subject is what you will scan in the history, and the body is what will save you from guessing. The graph shows the subject next to each commit.
