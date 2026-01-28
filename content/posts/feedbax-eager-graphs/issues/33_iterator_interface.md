# Iterator Interface and model.step Ergonomics

**Status**: Minor ergonomic annoyance
**Original Issue**: #6
**Complexity**: LOW
**Effort**: N/A (acceptable as-is)

## The Problem

Models are typically wrapped in `Iterator` for time-stepping:
```python
model = Iterator(step=SimpleFeedback(...), n_steps=100)
```

This creates awkward paths:
- Network weights: `model.step.net` (not `model.net`)
- Mechanics: `model.step.mechanics` (not `model.mechanics`)
- Training filter: `where_train=lambda m: m.step.net`

But state paths don't have `.step`:
- Network state: `state.net`
- Mechanics state: `state.mechanics`

Asymmetry between model and state structure.

## Your Observations (from Issue #6)

1. "Almost the entire model PyTree is under `model.step.*`"
2. `AbstractModel.step` property exists - returns `self` for non-iterators, `self._step` for iterators
3. Considered having `TaskTrainer` handle iteration internally

## Why It's Actually Fine

The `.step` indirection serves a purpose:
- **Clarity**: Makes explicit that `Iterator` wraps a single-step model
- **Access**: `model.step` always gives you the per-timestep model
- **Composition**: You could have `Iterator(step=Iterator(...))` (rare but possible)

The asymmetry with states is because:
- Model: Hierarchical (Iterator contains step model)
- State: What the step model operates on (no Iterator wrapper)

## Potential Improvements

### Option 1: Passthrough Properties

```python
class Iterator:
    @property
    def net(self):
        return self.step.net

    @property
    def mechanics(self):
        return self.step.mechanics
```

Access via `model.net` while maintaining structure.

### Option 2: Use `__getattr__`

```python
class Iterator:
    def __getattr__(self, name):
        return getattr(self.step, name)
```

Automatically delegates attribute access.

**Warning**: This can be confusing and breaks explicit-is-better-than-implicit.

### Option 3: Accept It

The `.step` pattern is clear and consistent. Users learn it once.

## Recommendation

Accept current behavior. If users complain, consider Option 1 (explicit passthrough) for the most common attributes.

Not worth significant effort.
