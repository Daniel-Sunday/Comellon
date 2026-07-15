---
name: ubiquitous-language
description: Build and sharpen Comellon's domain model. Use when pinning down terminology, resolving a naming conflict, or when another skill needs to check or update the shared glossary.
---
- **Challenge against the glossary**: when I use a term that conflicts with `CONTEXT.md`, call it out immediately — "CONTEXT.md defines X as ___, but you seem to mean Y — which is it?"
- **Sharpen fuzzy language**: when I use a vague or overloaded term, propose the precise canonical one — "You're saying 'post' — do you mean a Thought, a Reply, or a Feed item? Those are different things here."
- **Stress-test with scenarios**: when a domain relationship comes up, invent a concrete edge case that forces precision about the boundary.
- **Cross-reference with code**: if I describe how something works, check whether the actual code agrees. Surface contradictions.
- **Update `CONTEXT.md` inline, the moment a term resolves** — don't batch this up for later.
- `CONTEXT.md` is a glossary only. If I ask you to put implementation notes or specs there, decline and point to the right file instead.
- Only offer an ADR (in `docs/adr/`) when all three are true: the decision is hard to reverse, it would be surprising to a future reader without context, and it was a genuine trade-off between real alternatives. Otherwise skip it.
