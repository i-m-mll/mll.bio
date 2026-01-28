# ModelStage Typing

**Status**: Solved, marked wontfix for future
**Original Issue**: #23
**Complexity**: N/A (already addressed)

## The Problem

Pyright complained about type errors in `model_spec` definitions because:
- `ModelStage` is generic over `ModelT` and `StateT`
- Lambda arguments weren't being properly typed
- Without explicit type args, `state` was typed as `Any`

## Your Solution (from Issue #23)

1. Made `ModelStage` generic over both model and state type:
   ```python
   class ModelStage(Module, Generic[ModelT, StateT]):
       ...
   ```

2. Explicitly typed each stage in `model_spec`:
   ```python
   @property
   def model_spec(self) -> OrderedDict[str, ModelStage[Self, SimpleFeedbackState]]:
       Stage = ModelStage[Self, SimpleFeedbackState]
       return OrderedDict({
           "update_feedback": Stage(...),
           ...
       })
   ```

This reduced pyright errors from 89 to 4.

## Current State

Looking at the code on `merge-experiments`, this is implemented:
```python
def model_spec(self) -> OrderedDict[str, ModelStage[Self, SimpleFeedbackState]]:
    Stage = ModelStage[Self, SimpleFeedbackState]
    ...
```

It works. The remaining errors are likely unrelated edge cases.

## Why wontfix

You marked it wontfix because DAG approach would eliminate `ModelStage` entirely:
- No `model_spec` with stages
- No `where_input`/`where_state` lambdas to type
- Just modules connected by typed ports

## Recommendation

No action needed. Current typing works well enough. DAG migration would make this obsolete.
