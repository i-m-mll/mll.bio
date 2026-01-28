# Abstract-Final Pattern and Repeated Field Definitions

**Status**: Non-issue (was confusion)
**Original Issue**: #20, #24
**Complexity**: N/A

## The Concern

You worried that having `intervenors` as a field in `AbstractStagedModel` violates equinox's abstract-final pattern, which says:
- Abstract classes should have no concrete fields
- Final classes should have no abstract methods

And that every subclass having to define `intervenors` is annoying boilerplate.

## Why It's Not a Problem

From your own later comment in Issue #24:
> I just revisited this issue and was confused why I had thought that the abstract-final pattern implied that `AbstractState` must have `AbstractVar` fields for all attributes used by subclasses -- I don't see a reason for that now.

The abstract-final pattern only matters when `strict=True`:
- Empty base classes are not considered abstract
- You only need `AbstractVar` for fields that subclasses must override with different types

`intervenors` in subclasses all have the same type (`ModelIntervenors[StateT]`), so:
- Could be defined in base class as concrete field
- OR defined in subclasses (current approach) - minor boilerplate, explicit

## The "Repeated Field" Annoyance

Every `AbstractStagedModel` subclass defines:
```python
intervenors: ModelIntervenors[MyStateType]
```

This is ~1 line of boilerplate per model class. Not worth major refactoring to eliminate.

## Resolution

You marked this wontfix because DAG approach makes it moot anyway. With DAG:
- No special `intervenors` field
- Intervenors are just modules in the graph
- No abstract-final concerns

## Recommendation

No action. The current pattern is fine. Don't overthink it.
