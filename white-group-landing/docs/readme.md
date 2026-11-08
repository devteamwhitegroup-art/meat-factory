# White Group landing page: 3-agent setup for Claude Code

## Install
Copy the `.claude/agents/` folder into the ROOT of the White Group website repo:

    your-repo/
      .claude/agents/wireframe-designer.md
      .claude/agents/implementer.md
      .claude/agents/motion-engineer.md

Commit it so the whole team gets the same agents. Restart Claude Code (or start a new session) in the repo.

## Run the pipeline (one step at a time, review between steps)

1) Design
   > Use the wireframe-designer subagent to plan the new investor & partner landing page. Here is info about White Group: <paste company description, numbers, partners, current site URL>

   Review docs/design/. Answer the TODO questions and edit anything you disagree with.

2) Build
   > Use the implementer subagent to build the landing page from docs/design/.

   Run the site locally and check both MN and EN.

3) Motion
   > Use the motion-engineer subagent to add motion based on the section motion notes.

## Tips
- Run them in order. Each agent reads the previous one's output from docs/design/, so that folder is the handoff.
- Work section by section for better quality, e.g. "Use the implementer subagent to build only sections 01–03."
- Want a different model? Change the `model:` line (opus / sonnet / haiku / inherit).