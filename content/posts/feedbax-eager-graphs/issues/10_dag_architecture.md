# DAG-Based Model Architecture

**Status**: Major architectural decision
**Original Issues**: #19, #28 (Discussion)
**Complexity**: HIGH
**Effort**: 3-6 weeks for core, longer for full migration

## What This Is

Replace the current "staged model" approach (sequential operations on shared state) with a DAG (directed acyclic graph) of modules connected by typed ports.

## Why You Wanted This

The staged model approach has inherent limitations:

1. **Sequential only**: `model_spec` is an `OrderedDict` - stages execute in order. You can't naturally express parallel paths or feedback loops (except by nesting models).

2. **Intervention routing is awkward**: The `ModelInput(value, intervene)` pattern exists solely to thread intervention parameters through nested models. It's a hack.

3. **State structure is rigid**: Every substep you might want to intervene on must be explicitly surfaced in the state PyTree structure.

4. **Reusability suffers**: A `Channel` or `Mechanics` module is tightly coupled to its parent's state structure via `where_input`/`where_state` lambdas.

## What the DAG Approach Looks Like (from Collimator)

From your notes in Discussion #28:

```
Modules have input/output PORTS
Ports are connected by WIRES
Evaluation is LAZY - to get an output, you recursively evaluate its dependencies
```

### Key Components

1. **Leaf modules** ("atomic" operations that can't be subdivided for intervention)
2. **Composite modules** (DAGs of leaf modules that act as single nodes)
3. **Ports** (typed input/output connection points)
4. **Wires** (connections between ports)
5. **Context** (carries all state through the graph)

### Intervention Becomes Simple

To intervene between modules A and B:
- Disconnect the wire from A.output to B.input
- Insert new module C
- Connect A.output → C.input, C.output → B.input

No need for `ModelInput`, no need for intervention label routing, no need for explicit `intervenors` field.

## Implementation Approach

### Phase 1: Core Infrastructure
- Define `Port` class (typed, named connection point)
- Define `Wire` class (connection between ports)
- Define `LeafModule` base class with ports and `evaluate(context)` method
- Define `Context` class (carries state through evaluation)
- Implement lazy evaluation with caching

### Phase 2: Basic Modules
- Convert `Channel` to DAG-style module
- Convert simple neural network layers
- Create composition utilities

### Phase 3: ODE Integration
- Handle continuous vs. discrete operations
- Integrate with Diffrax (aggregate ODEs, step, then discrete updates)
- This is the tricky part - Collimator separates `continuous_state` and `discrete_state`

### Phase 4: Migration
- Rewrite `SimpleFeedback` as a DAG
- Rewrite `Mechanics` as a DAG
- Update `Iterator` to work with DAG models
- Update `TaskTrainer` for new interface

## Complexity Assessment

**Why it's hard:**
- Lazy evaluation with caching needs careful implementation
- ODE aggregation and stepping must integrate cleanly
- Existing training infrastructure assumes current interface
- Need to maintain backward compatibility during transition (or do a clean break)

**Why it might be easier than expected:**
- Collimator exists as a working example
- The core concepts (ports, wires, lazy eval) are well-understood
- Much of the model logic stays the same - just restructured
- Many current abstractions (`AbstractDynamicalSystem`, etc.) can be reused

## Decision Point

**Option A: Full Migration**
- Pros: Cleaner architecture, many issues go away, better long-term
- Cons: Significant work, breaking changes, need to re-test everything

**Option B: Hybrid/Incremental**
- Keep staged models for now
- Add DAG capabilities as an alternative
- Migrate models one by one
- Cons: More complexity during transition, two paradigms to maintain

**Option C: Stay with Staged Models**
- Address individual pain points incrementally
- Accept architectural limitations
- Focus on scientific features instead

## If You Choose Option A

Start by reading Collimator's source:
- https://github.com/collimator-ai/pycollimator
- Focus on: `LeafSystem`, `BaseContext`, port/wire implementation
- Note how they handle ODE vs. discrete updates

Then prototype:
1. Simple two-module chain (no ODEs)
2. Add lazy evaluation caching
3. Add intervention insertion
4. Tackle ODE integration
5. Build out from there
