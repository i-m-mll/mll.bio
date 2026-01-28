# MultiModel and Feedback Channels

**Status**: Working, minor awkwardness
**Original Issue**: #30
**Complexity**: LOW

## The Situation

`SimpleFeedback` has multiple feedback channels (e.g., visual, proprioceptive) with different delays and noise. These are organized as:

```python
self.feedback_channels = MultiModel(jt.map(
    lambda spec: Channel(...),
    feedback_specs,
    ...
))
```

`MultiModel` wraps a PyTree of models and applies them in parallel via `tree_map`.

## The Awkwardness

1. **Accessing individual channels**: `model.feedback_channels.models['vision']`
2. **Intervenors on channels**: Have to navigate through `MultiModel`
3. **ModelInput in non-staged model**: `MultiModel` isn't an `AbstractStagedModel`, but receives `ModelInput` anyway to pass `intervene` params through

From your issue:
> it seems strange that we should pass intervention parameters via `ModelInput`... since `MultiModel` has no stages

## Why It Works

- `MultiModel` just tree_maps over its models
- Each `Channel` is an `AbstractModel` (not staged)
- Intervention params pass through even if unused
- The structure is explicit and inspectable

## With DAG Approach

Multiple channels become separate modules in the graph:
- Each connects from mechanics state to a different input port of the network
- No special `MultiModel` wrapper needed
- Intervention is just inserting a module on a wire

## Improvement Without DAG

Could add convenience methods:
```python
class SimpleFeedback:
    def get_channel(self, name: str) -> Channel:
        return self.feedback_channels.models[name]

    def intervene_on_channel(self, name: str, intervenor):
        # Sugar for navigating to the right place
```

## Recommendation

Low priority. Current implementation works. DAG migration would clean this up naturally.
