---
name: improve-codebase-architecture
description: Scan the codebase for deepening opportunities — shallow modules, tight coupling, untested seams — and propose refactors toward deep modules.
---
- Use this exact vocabulary in every suggestion, and nothing else — **module, interface, implementation, depth, seam, adapter, leverage, locality**. Do not drift into "component," "service," "API," or "boundary."
- **Scoping**: if I name a target (a module, a pain point), go straight there. Otherwise, check `git log --oneline` for hot spots — files and areas that keep recurring — and look there first. Don't scan the whole codebase by default; that's wasted effort (YAGNI).
- **Exploration is organic, not checklist-driven.** Look for: places where understanding one concept means bouncing between many small modules; modules whose interface is nearly as complex as their implementation (shallow); pure functions extracted only for testability while the real bugs live in how they're called (no locality); tightly-coupled modules leaking across their seams; untested seams.
- **The deletion test**: for anything you suspect is shallow, ask — would deleting it concentrate complexity elsewhere, or just relocate it? "Concentrates" is the real signal of a shallow module worth deepening.
- **Report the findings before touching code.** Present candidates as a simple report (module, why it's shallow, what deepening would look like) and let me pick one before you refactor anything.
- Once I pick a candidate: check `CONTEXT.md` for the concept's name (add it if the deepened module represents something not yet in the glossary), then hand off to the `tdd` skill to implement the refactor test-first.
- If I reject a suggestion for a real reason, offer an ADR only if that reason would matter to someone re-investigating this later — skip it for throwaway reasons.
