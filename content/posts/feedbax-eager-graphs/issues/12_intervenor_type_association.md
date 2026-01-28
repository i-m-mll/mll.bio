# Associate Intervenor Types with Model Types

**Status**: Obviated by DAG approach
**Original Issue**: #17
**Complexity**: N/A (don't implement)

## The Idea

Automatically infer where an intervenor should be added based on its type:
```python
# Instead of:
add_intervenor(model, CurlField(...), where=lambda m: m.step.mechanics)

# Just:
add_intervenor(model, CurlField(...))  # Knows to go to Mechanics
```

Because `CurlField` is designed for `MechanicsState`, it should automatically find the `Mechanics` component.

## Why You Marked It wontfix

From Issue #17:
> This should be simplified/obviated if we replace the staged model approach with a DAG approach.

With DAG:
- Intervenors are modules in the graph
- You insert them at specific wire connections
- Type compatibility is checked by port types
- No magic inference needed

## If You Did Want This (Without DAG)

Would require:
1. Type annotations on intervenors: `CurlField: AbstractIntervenor[MechanicsState]`
2. Model traversal to find components with matching state types
3. Ambiguity handling when multiple components match

Doable but not worth it given DAG plans.

## Recommendation

Don't implement. Either:
- Do the DAG migration (makes this natural)
- Keep explicit `where` (clear and works)
