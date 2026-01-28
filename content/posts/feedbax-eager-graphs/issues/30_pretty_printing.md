# Pretty Printing Model Specs

**Status**: Nice-to-have ergonomic improvement
**Original Issue**: #18
**Complexity**: LOW
**Effort**: 1-2 hours

## The Problem

When you print a model's `model_spec`, the `where_input` and `where_state` lambdas show as `<function <lambda> at 0x...>`, which isn't helpful.

You wanted output like:
```
hidden: GRUCell(<lambda>, state.hidden) -> state.hidden
readout: Linear(state.hidden) -> state.readout
```

## Current State

`pformat_model_spec` in `_staged.py` already does most of this:
```python
def pformat_model_spec(model, indent=2, newlines=False) -> str:
    # Shows callable name/type
    # Shows intervenors
    # Recursively handles nested staged models
```

It shows:
```
hidden: GRUCell
readout: Linear
```

But not the `where_input` → `where_state` flow.

## Solutions

### Option 1: Use WhereDict's Lambda Parsing

From Issue #14, you have `WhereStrConstructor` that can convert:
```python
lambda state: state.mechanics.effector
# Into: "mechanics.effector"
```

Apply this to `where_input` and `where_state` lambdas in `pformat_model_spec`.

### Option 2: Store String Representations

When constructing `ModelStage`, also store string versions:
```python
class ModelStage(Module):
    callable: ...
    where_input: ...
    where_state: ...
    _input_label: str = ""
    _state_label: str = ""
```

Set these in `model_spec` definitions. More explicit but more boilerplate.

### Option 3: Docstrings/Annotations

Add descriptive info to stage definitions that `pformat_model_spec` can extract.

## Recommended Implementation

Use `WhereStrConstructor` approach:

```python
def _where_to_str(where_func: Callable) -> str:
    """Convert a where lambda to a string representation."""
    try:
        return where_func(WhereStrConstructor("")).label
    except:
        return "<complex>"

def pformat_model_spec(model, ...):
    for label, stage in model._stages.items():
        input_str = _where_to_str(stage.where_input)
        state_str = _where_to_str(stage.where_state)
        # Format: "label: Callable(input_str) -> state_str"
```

Handles simple attribute access; complex lambdas show `<complex>`.

## Priority

Low. Useful for debugging/understanding models, but the code is readable and `pformat_model_spec` already exists.
