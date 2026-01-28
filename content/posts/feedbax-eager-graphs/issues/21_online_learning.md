# Online Learning / Intervening on Model Parameters

**Status**: Valuable feature to implement
**Original Issue**: #21
**Complexity**: MEDIUM-HIGH
**Effort**: 1-2 days

## The Problem

Current intervenors can only modify the **state** PyTree, not the **model** PyTree. This prevents implementing online learning algorithms where model parameters (e.g., neural network weights) are updated during a trial, not just between trials.

## Why Intervenors Can't Modify Parameters

In JAX/Equinox, modules are treated as immutable. When you modify a module, you get a new copy. The current `AbstractIntervenor` signature:

```python
def __call__(self, params, state, *, key) -> state
```

The intervenor receives the state, modifies it, and returns the modified state. The model itself is not passed or returned.

## Your Proposed Solution

From Issue #21: Intervene at the `AbstractIterator` level.

The iterator wraps a single-step model and calls it repeatedly. If the iterator received both the model and state, it could return modified versions of both:

```python
class AbstractIterator:
    def __call__(self, model, input_, state, key) -> (model, states):
        for t in range(n_steps):
            state = model(input_[t], state, key[t])
            # Parameter update intervenor:
            model = apply_parameter_intervenors(model, state, key[t])
        return model, states
```

## Implementation Approach

### Option A: Iterator-Level Parameter Intervenors

1. Add `parameter_intervenors` field to `Iterator` (or a new `LearningIterator`)
2. These intervenors have signature: `(model, state, key) -> model`
3. Apply after each time step (or every N steps)
4. Return both final model and state trajectory

**Pros**: Clean separation, explicit about when learning happens
**Cons**: Only allows per-timestep updates, not within-timestep

### Option B: Include Parameters in "State"

Move trainable parameters into the state PyTree:
```python
class LearningState(Module):
    model_state: SimpleFeedbackState  # Normal state
    params: PyTree[Array]  # Trainable parameters
```

Then regular intervenors can modify `params`, and the model reads from state.params.

**Pros**: Works with existing intervenor infrastructure
**Cons**: Weird separation between "model" and "params", less readable

### Option C: Unified Model-State Object

Make the model itself part of what gets passed through:
```python
class ModelWithState(Module):
    model: AbstractModel
    state: StateT
```

Intervenors and stages operate on this combined object.

**Pros**: Most flexible
**Cons**: Major architectural change, basically a different framework

## Recommended Approach

**Option A is cleanest** for the current architecture:

1. Create `LearningIterator` subclass
2. Add `LearningRule` abstraction (like `AbstractIntervenor` but for params)
3. Implement a few concrete rules:
   - `HebbianRule`
   - `ReinforcementRule`
   - `GradientDescentRule` (for online gradient updates)

4. Allow scheduling rules like intervenors:
```python
iterator = LearningIterator(
    step=model,
    n_steps=100,
    learning_rules={
        "hebbian": HebbianLearningRule(
            where=lambda model: model.net.hidden.weight,
            lr=0.001
        )
    }
)
```

## Complexity Notes

The tricky parts:
- Ensuring learned parameters are properly tracked for training (outer loop)
- Handling interaction between online updates and batch gradient descent
- State structure when both model and state are evolving
- Serialization of learned models mid-trial

## Scientific Value

This enables:
- Hebbian learning in neural network components
- Error-driven learning within trials
- Reward-modulated plasticity
- Meta-learning experiments
- Modeling biological learning timescales
