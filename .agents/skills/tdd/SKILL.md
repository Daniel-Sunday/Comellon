---
name: tdd
description: Test-driven development with a red-green-refactor loop. Use when building features or fixing bugs test-first, or when the user mentions red-green-refactor.
---
- Tests verify behavior through public interfaces, not implementation details. A test that breaks on a refactor with no behavior change was testing the wrong thing.
- **Never write all tests first, then all implementation** ("horizontal slicing"). This produces tests that check imagined behavior instead of real behavior, and go insensitive to real breakage.
- Correct approach: **vertical slices, one tracer bullet at a time.**
  ```
  RED → GREEN: test1 → impl1
  RED → GREEN: test2 → impl2
  RED → GREEN: test3 → impl3
  ```
- Before writing code: confirm the interface change needed, confirm which behaviors matter most to test (you can't test everything — prioritize), look for opportunities to deepen the module (small interface, real logic behind it).
- One test at a time. Only enough code to pass it. Don't anticipate future tests.
- Never refactor while a test is red. Get to green first, then refactor: extract duplication, deepen modules, run tests after each refactor step.
- Check `CONTEXT.md` before naming tests or interfaces — vocabulary should match the glossary, not invent synonyms.
