---
title: git branching model
version: v0.1.0
---

<!-- markdownlint-disable MD025 -->

# Git branching model

<!-- markdownlint-enable MD025 -->

This document describes the branch management strategy for pull requests made by the ChatGPT chat version through the connected GitHub repository. It does not apply to Codex working in the local checkout; Codex must not run Git commands or commit changes.

## Change history style

The project follows linear history in order to:

- Simplify code review and component separation.
- Preserve a clear chronological sequence.
- Reduce the number of merge conflicts.
- Make changes easier to understand.

## Branch types

### Long-lived branches

- `default`:
  - Main branch for active development.
  - Holds the stable state of the project.
  - Protected branch (direct access is granted only to maintainers).
  - Changes are made via pull requests.
  - Direct commits are prohibited.

### Working branches

- `feature`:
  - Each new feature is developed in a separate branch, which helps isolate changes.
- `fix`:
  - Used for focused fixes, including documentation corrections.

### Format

Working branch names use the following naming format:

```text
feature/<short-descriptive-name>
fix/<short-descriptive-name>
```

For example: `feature/user-authentication`

## Branch management rules

### 1. Creation

- Branch from `default`; changes are merged back after the work is complete.
- Keep branches short-lived: strive to minimize branch lifetime by merging changes into `default` often and regularly.
- Limit the scope of a branch to one logically complete change: do not mix refactoring with new functionality or problem fixes.

### 2. Naming

- Use lowercase letters.
- Separate words with hyphens.
- Keep branch names within 30 characters.
- Do not use special characters.

### 3. Change synchronization

- Review divergence from `default` before PR completion.
- Resolve conflicts safely; do not force-push or rewrite shared history without explicit permission.

### 4. Cleanup

- Delete merged branches.
- Archive experimental branches if any remain.
- Delete stale branches regularly.

## Change merge procedure

Changes are made according to this workflow:

1. Create a branch from `default`.
2. Work on the current task and commit the changes.
3. Create a merge or pull request.
4. Review changes and available checks; record any unperformed CI or browser QA.
5. Safely reconcile with the latest `default` when needed.
6. Obtain explicit maintainer authorization to merge.
7. The authorized maintainer chooses a repository-supported merge method consistent with the linear-history preference. Agents must not merge without explicit authorization.
