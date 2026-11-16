---
name: "diagnosing-bugs"
description: "Diagnosis loop for hard bugs and performance regressions. Use when the user says \"diagnose\"/\"debug this\", or reports something broken/throwing/failing/slow."
---

# diagnosing-bugs

This is the Claude Code entry point for a project skill shared with Codex.

1. Read the repository-root instructions at `../../../AGENTS.md`.
2. Read and follow the canonical skill at `../../../.agents/skills/diagnosing-bugs/SKILL.md`.
3. Resolve supporting links and relative file paths from the canonical skill directory, `../../../.agents/skills/diagnosing-bugs/`, rather than this wrapper directory.

The user's request and repository instructions retain precedence. Keep the canonical files as the single source of truth. Regenerate this wrapper from the repository root with `node scripts/skills.mjs sync` after changing skill metadata.
