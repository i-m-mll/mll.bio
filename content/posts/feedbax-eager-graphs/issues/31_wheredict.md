# WhereDict: Lambdas as Dictionary Keys

**Status**: Working solution exists, minor optimization possible
**Original Issue**: #14
**Complexity**: LOW (already solved)

## The Problem

You need to map from "where lambdas" to values:
```python
trial_spec.init[lambda state: state.mechanics.effector]  # Should work
trial_spec.init["mechanics.effector"]  # Should also work
```

But lambdas can't be dict keys directly (identity-based, not value-based equality).

## Your Solutions (from Issue #14)

### Solution 1: `dis` Bytecode Parsing
Parse the lambda's bytecode to extract attribute accesses:
```python
lambda x: x.foo.bar  →  "foo.bar"
```
~100μs construction, ~100μs access. Works but has overhead.

### Solution 2: `_NodeWrapper` with `tree_at`
Use equinox's `tree_at` machinery to find paths:
- Slower (2-3x) than `dis`
- Requires access to actual pytree
- Handles more cases (dict keys, indices)

### Solution 3: `WhereStrConstructor` (your favorite)
```python
class WhereStrConstructor:
    def __init__(self, label: str):
        self.label = label
    def __getattr__(self, name: str):
        return WhereStrConstructor(f"{self.label}.{name}")
    def __getitem__(self, key):
        return WhereStrConstructor(f"{self.label}[{key}]")

where_func_to_label = lambda where: where(WhereStrConstructor("")).label
```
~10μs - much faster. Doesn't need a pytree. Your recommended approach.

## Current Usage

`WhereDict` in `feedbax/_mapping.py` uses the `dis` approach. It works for `trial_spec.init` and `trial_spec.targets`.

## Potential Improvement

Switch `WhereDict` internals to use `WhereStrConstructor`:
- 10x faster key lookup
- Simpler code
- Same interface

## When It Matters

Only noticeable if you're doing many `WhereDict` lookups in hot paths. Since these are typically used at trial setup (not inner loop), current performance is fine.

## Recommendation

Low priority. Current implementation works. If you refactor `_mapping.py`, consider switching to `WhereStrConstructor` for simplicity.
