---
name: jankane-development
description: じゃんかね（road-to-rich）の機能追加、UI改善、対局入力、順位表・段位・精算の修正、Firebase同期、3D牌、不具合調査、レビューに使う。既存の仕様とデザインを確認し、必要な専門スキルを選んで実装・検証まで進める。他プロジェクトには適用しない。
---

# じゃんかねの開発

Read the repository-root `AGENTS.md` first. Treat the current user request as the task; use this skill to carry that task through implementation and verification. The supporting documents below are relative to this skill directory.

## 1. Establish the change

- Inspect the working tree and affected source before choosing an implementation. Preserve unrelated edits. Record the comparison base at the start when preparing a branch review.
- Read the relevant sections of [project context](../../../docs/development/jankane-context.md), then the source and current design document it points to. Source and current task requirements take precedence over stale README descriptions.
- State the expected user-visible result and affected routes, state, calculations, and persistence. Resolve routine details from the existing product. Ask only when an unresolved choice materially changes the requested result or access is actually missing.
- For a substantial change, keep a short task-local brief: goal, acceptance criteria, affected data, and chosen verification. An existing design document or the current task can supply the brief; do not create external issues merely to satisfy a workflow.

## 2. Select relevant skills

Load only the skills needed for this change. Paths in this table are relative to `.agents/skills/`.

| Task | Skill | Jankane context |
| --- | --- | --- |
| Visual hierarchy, typography, screen composition | `frontend-design/SKILL.md` | Preserve the agreed black glass design, bold Mincho headings, existing tile art, and open layouts. |
| Forms, focus, touch, overlays, responsive UI | `web-design-guidelines/SKILL.md` | Use the bundled guidelines; interpret copy rules for Japanese UI. |
| React rendering or loading performance | `vercel-react-best-practices/SKILL.md` | React + Vite SPA, Zustand and Firebase. Select applicable client-side rules; no Next.js or RSC migration. |
| 3D startup, frame time, GPU/resource lifecycle | `threejs-performance/SKILL.md` | Direct Three.js r180. Measure the existing renderer; preserve assets and interaction. |
| Reproducible failures or regressions | `diagnosing-bugs/SKILL.md` | Prefer the existing tests or isolated QA fixture as the feedback loop. |
| Module boundaries or hard-to-test state | `codebase-design/SKILL.md` | Apply when an actual change requires restructuring. Explain findings in the project's usual Japanese vocabulary. |
| Completed branch/diff review | `code-review/SKILL.md` | Supply a resolved base SHA and the task/spec source; use the configured local tracker document. |
| Firestore security rules review | `firebase-security-rules-auditor/SKILL.md` | Inspect the real anonymous-auth/room-code model. Separate observed rules from assumptions about intended access. |

## 3. Implement within the actual architecture

- Follow `src/App.tsx` tab routing and existing stores. Do not introduce a router, state library, server framework, or rendering framework just because an upstream example uses one.
- Check the domain section of the project context before changing scores, fees, chips, ranks, seasons, or aggregation. Derive expected values independently from the stated rules; maintain old record compatibility.
- For Firebase work, follow the `roomRepo` to store subscription flow. Inspect concurrent writes, errors, unsubscribe behavior, and partial saves when affected. Keep schema and access-model changes explicit in the task scope.
- For Three.js work, distinguish first-frame loading from steady-state frame cost. Preserve deferred loading, idle rendering, visibility handling, fallback, reduced motion, and resource disposal.
- Use existing components, tokens, assets, and dependencies when they fit. Add abstractions only for a demonstrated need.

## 4. Verify the result

Follow [verification guidance](../../../docs/development/verification.md). Choose checks that can detect the requested failure or confirm the user-visible behavior.

- Use existing Vitest/Testing Library boundaries for scoring, state, input, and lifecycle changes. Add a focused regression test when it protects meaningful behavior; use independent expected results.
- For visual or interaction work, inspect the running QA fixture through available browser tools, including the relevant narrow layout and fallback/reduced-motion state. A passing DOM test does not prove layout or GPU rendering.
- Run `npm run check` for the full development gate when warranted by the change or CI. Use narrower checks during iteration.
- Keep fixture verification separate from production Firebase checks and physical iPhone/Safari checks. Describe exactly what was observed; do not infer a successful environment you did not test.

## 5. Review and deliver

- Re-read the diff against the acceptance criteria. For nontrivial changes, use an independent review when available. Give `code-review` the recorded base and an explicit specification source, as described in [tracker configuration](../../../docs/agents/issue-tracker.md).
- Resolve findings that affect the requested behavior. Keep unrelated improvements as observations rather than expanding the change silently.
- Report the result, the important decisions, verification evidence, and any remaining concrete limitation. Preserve the repository's existing PR and changelog workflow.

This skill and the installed references do not grant deployment, account, data, spending, or communication authority. Use the authorization in the actual user task and the environment's permissions.
