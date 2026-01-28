# Feedbax Issues Overview

This directory contains distilled and clarified versions of the issues and discussions from the feedbax repository, analyzed against the current `merge-experiments` branch.

## The Core Tension

Almost all of the structural issues in feedbax stem from a single architectural tension:

**The staged model approach (sequential operations on a shared state) vs. the DAG approach (lazy-evaluating graph of connected modules).**

You recognized this in Discussion #28 (July 2024) and marked many issues as "wontfix" because a DAG approach would obviate them. This was the right insight. The staged model approach creates complexity because:

1. **Intervention routing is awkward**: Passing `ModelInput` with separate `value` and `intervene` fields through nested models is a hack to get per-trial intervention parameters to the right intervenors.

2. **State structure must be explicit**: Every piece of state you might want to intervene on must be a field in the state PyTree.

3. **Composability is limited**: You can't easily express arbitrary computation graphs - only sequential stages with fan-in/fan-out via `where_input`/`where_state` lambdas.

## What You Were Confused About (That's Now Clear)

### 1. "Abstract-Final Pattern" Confusion (Issues #20, #24)
You worried about violating equinox's abstract-final pattern by having `intervenors` defined in `AbstractStagedModel`. **This was a non-issue.** The pattern only matters for classes that are truly abstract (have abstract methods/vars). An empty base class isn't abstract. The real problem was needing to repeat `intervenors` field definitions - but that's a minor ergonomic issue, not a conceptual problem.

### 2. State Typing Confusion (Issues #23, #24)
You went back and forth on whether `StateT` should be bound to `AbstractState`, `equinox.Module`, or `PyTree[Array]`. **The answer**: `PyTree[Array]` is most general and correct. State objects are just pytrees - there's no need for an `AbstractState` base class. The type variable exists for generic type-checking, not for runtime behavior.

### 3. Where to Put Effector State (Issue #1, Discussion #29)
You debated whether effector state belongs in `MechanicsState` vs `SkeletonState`. **Current solution is fine**: effector is in `MechanicsState` because `Mechanics` is responsible for syncing it with the skeleton configuration. The "annoying" path `state.mechanics.plant.skeleton` vs `state.mechanics.skeleton` is just naming - not worth restructuring for.

### 4. Multiple Inheritance in AbstractPlant/AbstractMuscle (Issues #1, #34)
You noted that `AbstractPlant` inherits from both `AbstractStagedModel` and `AbstractDynamicalSystem`, which feels weird. **This is actually fine** - it's expressing that a plant has both kinematic operations (staged) and ODE dynamics (vector field). Issue #34's suggestion (muscle activation dynamics in `AbstractMuscle`) is still a good cleanup.

## Issue Categories

### Already Resolved (Closed or Actually Working)
- [01_optax_recompilation.md](01_optax_recompilation.md) - Fixed
- [02_validation_caching.md](02_validation_caching.md) - Fixed
- [03_lti_system.md](03_lti_system.md) - Fixed
- [04_loss_generalization.md](04_loss_generalization.md) - Implemented
- [05_validation_history.md](05_validation_history.md) - Implemented
- [06_trial_spec.md](06_trial_spec.md) - Simplified
- [07_intervenor_ensembles.md](07_intervenor_ensembles.md) - Fixed

### Will Be Obviated by DAG Architecture
- [10_dag_architecture.md](10_dag_architecture.md) - **THE BIG ONE**
- [11_model_input_routing.md](11_model_input_routing.md) - Solved by DAG
- [12_intervenor_type_association.md](12_intervenor_type_association.md) - Solved by DAG
- [13_abstract_final_pattern.md](13_abstract_final_pattern.md) - Solved by DAG
- [14_multimodel_channels.md](14_multimodel_channels.md) - Solved by DAG
- [15_model_stage_typing.md](15_model_stage_typing.md) - Solved by DAG

### Actionable Improvements (Current Architecture)
- [20_muscle_activation.md](20_muscle_activation.md) - Move activation to AbstractMuscle
- [21_online_learning.md](21_online_learning.md) - Parameter interventions
- [22_ensemble_training.md](22_ensemble_training.md) - Vmap improvements
- [23_channel_spec.md](23_channel_spec.md) - Cleanup ChannelSpec
- [24_python_39.md](24_python_39.md) - Backport typing
- [25_musculoskeletal_geometry.md](25_musculoskeletal_geometry.md) - MotorNet-style wrappings

### Nice-to-Have / Low Priority
- [30_pretty_printing.md](30_pretty_printing.md) - Better model_spec printing
- [31_wheredict.md](31_wheredict.md) - Lambda-as-key implementation
- [32_jaxtyping_mixed.md](32_jaxtyping_mixed.md) - Type checking with non-arrays
- [33_iterator_interface.md](33_iterator_interface.md) - model.step ergonomics

## Recommended Priorities

1. **Decide on DAG migration** - This is the fundamental architectural question. If you're going to do it, many other issues become moot.

2. **If NOT doing DAG soon**: Focus on [21_online_learning.md](21_online_learning.md) and [20_muscle_activation.md](20_muscle_activation.md) as they have real scientific value.

3. **If doing DAG**: Start with [10_dag_architecture.md](10_dag_architecture.md) - read Collimator's approach, design the port system, and prototype with a simple model.
