---
name: "code-review"
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

# code-review

This is the Claude Code entry point for a project skill shared with Codex.

1. Read the repository-root instructions at `../../../AGENTS.md`.
2. Read and follow the canonical skill at `../../../.agents/skills/code-review/SKILL.md`.
3. Resolve supporting links and relative file paths from the canonical skill directory, `../../../.agents/skills/code-review/`, rather than this wrapper directory.

The user's request and repository instructions retain precedence. Keep the canonical files as the single source of truth. Regenerate this wrapper from the repository root with `node scripts/skills.mjs sync` after changing skill metadata.
