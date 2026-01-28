# ModelInput and Intervention Parameter Routing

**Status**: Architectural wart (obviated by DAG approach)
**Original Issue**: #12
**Complexity**: LOW (to understand), MEDIUM (to fix without DAG)

## The Problem

When you schedule an intervenor with per-trial parameters, those parameters need to get from the task to the specific intervenor instance, even when that intervenor is nested deep inside the model.

Current solution: `ModelInput` class with two fields:
- `value`: The actual task inputs
- `intervene`: A mapping from intervenor labels to their parameters

In `AbstractStagedModel.__call__`:
```python
if isinstance(callable_, AbstractModel):
    callable_input = ModelInput(subinput, input_.intervene)
else:
    callable_input = subinput
```

This checks if the stage callable is another `AbstractModel`, and if so, passes the full `ModelInput` (including intervention params) rather than just the subinput.

## Why It's Awkward

1. **Type ambiguity**: Callables receive either `ModelInput` or plain input depending on whether they're models
2. **Label management**: Intervenors need unique string labels for the routing to work
3. **Tight coupling**: The `intervene` mapping must have keys matching all nested intervenor labels
4. **Hacky feel**: You commented `# TODO: What's a less hacky way of doing this?`

## Why It Works Anyway

Despite being awkward, this approach is functional:
- Labels are auto-generated when scheduling intervenors
- The `intervene` dict is passed through unchanged to nested models
- Each `_apply_intervenors` call looks up params by label

## How DAG Solves This

With a DAG architecture:
- Intervenors are just modules in the graph
- Their inputs come from their connected ports
- Per-trial parameters are part of the `Context` state
- No special routing needed - evaluation traverses the graph naturally

## If You Want to Improve Without DAG

Option 1: **Explicit parameter paths**
- Instead of flat label → params mapping, use nested paths: `"mechanics.curl_field"` → params
- More explicit about where params go

Option 2: **Intervenor-specific context**
- Each intervenor gets its own slot in a hierarchical params structure matching model structure
- More type-safe, but more boilerplate

Option 3: **Leave it alone**
- It works, it's tested, the code comments explain it
- Focus energy elsewhere

## Recommendation

If you're planning DAG migration: leave this as-is.
If staying with staged models long-term: consider Option 1 for better clarity.
