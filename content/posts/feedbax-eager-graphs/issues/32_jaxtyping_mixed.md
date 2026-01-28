# Jaxtyping with Mixed Array/Non-Array PyTrees

**Status**: Minor typing limitation
**Original Issue**: #8
**Complexity**: LOW
**Effort**: N/A (workaround exists)

## The Problem

Functions like `tree_set` operate on PyTrees that have both array leaves (with batch dimensions) and non-array leaves (e.g., `None`, modules).

Type signature:
```python
def tree_set(tree: PyTree[Array | Any], idx: int, values: ...) -> PyTree[Array | Any]:
```

Problem: `Array | Any` ≡ `Any`, so jaxtyping's shape checking is bypassed.

## Your Workaround

From Issue #8:
> Insist that this function be applied after `tree` has been partitioned into `Array | None` leaves.

Use `eqx.partition` before calling shape-checked functions:

```python
arrays, non_arrays = eqx.partition(tree, eqx.is_array)
arrays = tree_set_arrays(arrays, idx, values)  # Shape-checked
tree = eqx.combine(arrays, non_arrays)
```

## Why This Isn't Really Fixable

Jaxtyping works on types, not values. There's no way to say "this PyTree has arrays at some leaves and non-arrays at others, check only the arrays."

Options:
1. **Partition/combine pattern** (current workaround)
2. **Ignore non-array leaves** in the type signature (loses checking)
3. **Require homogeneous PyTrees** (too restrictive)

## Practical Impact

Minimal. Most shape errors are caught at runtime anyway (JAX will complain about shape mismatches). The type annotations are documentation, not enforcement.

## Recommendation

No action needed. Document the partition/combine pattern where it's used. Accept that some functions have `Any` in their signatures.
