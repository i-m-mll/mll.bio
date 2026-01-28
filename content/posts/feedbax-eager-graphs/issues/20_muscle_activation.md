# Move Muscle Activation Dynamics to AbstractMuscle

**Status**: Actionable improvement
**Original Issue**: #34
**Complexity**: MEDIUM
**Effort**: 2-4 hours

## The Problem

Currently, `MuscledArm` (an `AbstractPlant` subclass) has a field `activator` which is an `AbstractDynamicalSystem` describing how muscle activation evolves. This gets included in `MuscledArm.dynamics_spec` and aggregated into the plant's `vector_field`.

**Conceptually wrong**: Activation dynamics are intrinsic to the muscle, not the plant. A muscle model should encapsulate its own activation filter.

**Practical confusion**: The "input" to the muscle is ambiguous - is it the neural command (before activation filter) or the activation level (after filter)?

## Current Structure

```
MuscledArm (AbstractPlant)
├── skeleton (AbstractSkeleton)
├── muscle (AbstractMuscle) -- kinematic stages only
├── activator (ActivationFilter) -- ODE for activation
└── dynamics_spec includes both skeleton ODE and activator ODE
```

## Proposed Structure

```
MuscledArm (AbstractPlant)
├── skeleton (AbstractSkeleton)
├── muscle (AbstractMuscle)
│   └── activator (ActivationFilter) -- internal to muscle
└── dynamics_spec includes skeleton ODE and muscle.activator ODE
```

Or better:

```
AbstractMuscle now inherits from both AbstractStagedModel AND AbstractDynamicalSystem
├── Has its own vector_field for activation dynamics
├── Has its own model_spec for kinematic updates
└── Owned by AbstractPlant, which aggregates its dynamics
```

## Implementation Steps

1. **Make `AbstractMuscle` inherit from `AbstractDynamicalSystem`**
   - Add `vector_field` method that implements activation dynamics
   - State type becomes `MuscleState` with activation as a field

2. **Move `activator` from `MuscledArm` to `VirtualMuscle`**
   - Remove `activator` field from `MuscledArm`
   - Add activation filter as internal component of muscle

3. **Update `dynamics_spec` in `MuscledArm`**
   - Reference `self.muscle` in dynamics_spec
   - `AbstractPlant.vector_field` will automatically aggregate

4. **Update state structures**
   - `MuscleState` includes activation state
   - `PlantState` still contains muscle state but structured differently

5. **Update `VirtualMuscle` and other muscle models**
   - Implement `vector_field` in each
   - Handle the case where no activation filter is used

## Why This Matters

- **Cleaner mental model**: A muscle is a self-contained component
- **Reusability**: Can swap muscle models without touching plant code
- **Consistency**: Same pattern as other composed dynamical systems
- **Scientific clarity**: "Muscle input" unambiguously means neural command

## Risks

- Breaking change to state structure (need to migrate existing code)
- May affect serialized models/checkpoints
- Need to update documentation and examples

## Testing

- Verify trained `MuscledArm` models still produce same trajectories
- Check that intervenors on muscle state still work
- Ensure ensemble training works after change
