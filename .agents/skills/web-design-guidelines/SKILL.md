---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0-jankane.1"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Adapted from Vercel's skill to use a reviewed, pinned local reference. Original source and the exact modification are recorded in `.agents/skills-lock.json` at the repository root.

## Review

1. Read repository-root `AGENTS.md` and the user's current UI request.
2. Read [the bundled Web Interface Guidelines](references/web-interface-guidelines.md).
3. Read the files or pattern requested by the user. When the task already identifies a screen or change, resolve its files from the codebase. Ask for a scope only if it cannot be established from the request or repository context.
4. Check the applicable rules and, when available, verify layout and interactions in the project's isolated QA fixture.
5. Report actionable findings with file and location, evidence, and user-visible impact. Distinguish code inspection from browser observation.

## Project applicability

- Use Japanese UI conventions; do not apply English Title Case or punctuation rules mechanically.
- This is a client-rendered React/Vite app. SSR hydration and framework-specific examples apply only if the affected implementation actually uses them.
- Respect the existing design brief and UI vocabulary. A generic guideline is not a request to redesign the product or change its navigation architecture.
- Do not treat a checklist match as proof of a defect. Evaluate behavior, context, and accessibility alternatives.

## Reference version

The bundled rules are from `vercel-labs/web-interface-guidelines` commit `434b7f91364665f2f733b310ec54809bf8f37937`, file `command.md`. Its MIT license is in [references/LICENSE](references/LICENSE).

Use this pinned copy for normal reviews. If the task explicitly asks for updated rules, compare the upstream source with this copy and report the version used; update the installed files and provenance together only as part of that requested change.
