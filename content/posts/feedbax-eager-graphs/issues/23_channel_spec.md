# ChannelSpec Cleanup

**Status**: Minor cleanup opportunity
**Original Issue**: #3
**Complexity**: LOW
**Effort**: 1-2 hours

## The Problem

`ChannelSpec` exists to specify a `Channel` without constructing it. It has fields:
- `where`: Lambda selecting which part of state to feed through channel
- `delay`: Number of timesteps
- `noise_func`: Function adding noise

This felt "hacky" because:
1. `ChannelSpec` duplicates `Channel` fields
2. The `where` lambda refers to a state type that `ChannelSpec` doesn't know about
3. Conversion from spec to channel requires knowing the parent model's state structure

## Current Implementation

In `SimpleFeedback.__init__`:
```python
feedback_specs = _convert_feedback_spec(feedback_spec)
example_mechanics_state = mechanics.init(key=jr.PRNGKey(0))

def _build_feedback_channel(spec: ChannelSpec):
    return Channel(
        delay=spec.delay,
        noise_func=spec.noise_func,
        init_value=0.
    ).change_input(
        spec.where(example_mechanics_state)
    )

self.feedback_channels = MultiModel(jt.map(
    lambda spec: _build_feedback_channel(spec),
    feedback_specs,
    is_leaf=lambda x: isinstance(x, ChannelSpec),
))
```

This actually works fine now. The "hacky" feeling came from confusion about separation of concerns.

## Why It's Actually Okay

1. **Specs are configuration objects** - They hold user intent before instantiation
2. **The `where` lambda** - Evaluated against a concrete state to determine input shape
3. **Conversion logic** - Lives in the model that knows its state structure

This pattern (spec → instance given context) is common and reasonable.

## Minor Improvements

### 1. Better Generic Typing

```python
@dataclass
class ChannelSpec(Generic[StateT]):
    where: Callable[[StateT], PyTree[Array]]
    delay: int = 0
    noise_func: Callable = Normal()
```

This makes the state type explicit.

### 2. Factory Method on Channel

```python
class Channel:
    @classmethod
    def from_spec(cls, spec: ChannelSpec, example_state: StateT) -> "Channel":
        return cls(
            delay=spec.delay,
            noise_func=spec.noise_func,
            init_value=0.
        ).change_input(spec.where(example_state))
```

Consolidates the conversion logic.

### 3. Consider Merging

If `ChannelSpec` and `Channel` fields are essentially the same, consider:
- `Channel` with a `build(example_input)` method
- No separate spec class

## Recommendation

Low priority. Current implementation works. If you touch this code for other reasons, consider the factory method improvement for clarity.
