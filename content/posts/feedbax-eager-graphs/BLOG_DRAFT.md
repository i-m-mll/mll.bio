---
title: "Rebuilding Feedbax: From Staged Models to Eager Graphs"
published: 2026-01-25
updated: 2026-01-25
draft: true
abstract: |
    A story about writing things down, waiting two years, and then watching AI
    implement the architecture you always wanted. How documenting architectural
    pain points in 2024 became the perfect context for AI-assisted refactoring
    in 2026—and what the new eager graph architecture looks like.
tags: jax, equinox, architecture, AI-assisted, feedbax, neuroscience
---

## The Best Decision I Made Was Writing It Down

In July 2024, I was deep in the weeds of feedbax—a JAX library for training neural network models of sensorimotor control. The core abstraction was something I called "staged models": an `OrderedDict` of operations that executed sequentially on a shared state. It worked. Models trained. Papers got written.

But something nagged at me.

The more I used the system, the more I noticed friction. Interventions—the perturbations neuroscientists apply to probe how controllers respond—required this awkward `ModelInput(value, intervene)` wrapper that threaded parameters through nested models. Intervenors weren't regular components; they were special-cased, inserted via PyTree surgery. And the `Iterator` class that wrapped single-step models felt like an extra layer of indirection that shouldn't exist.

So I did something that would prove surprisingly valuable: I wrote it all down.

I created an `issues/` directory and systematically documented every architectural pain point I'd encountered. Issue #10 was titled "DAG Architecture"—the big one, describing a potential migration from staged models to explicit graphs with typed ports. Issue #11 detailed the `ModelInput` routing hack. Issue #33 explained why the `Iterator` interface felt redundant. I marked several of them "wontfix" because I knew a proper DAG approach would make them moot.

Then I went back to writing my thesis.

---

## The Merge: feedbax-experiments Comes Home

Fast forward to early January 2026. I'd accumulated a separate repository—feedbax-experiments—with training infrastructure, analysis modules, and various improvements that had never been properly integrated. The merge was overdue.

<details>
<summary>The merge process (git subtree)</summary>

```bash
# Phase 1: Merge via git subtree
git subtree add --prefix feedbax/_experiments \
    ../feedbax-experiments main --squash

# Phase 2-3: Reorganize directories, merge types.py,
# move training/analysis/database modules into feedbax proper

# Result: Single coherent package with all the accumulated
# improvements from over a year of experimentation
```

</details>

This merge brought in things like the analysis framework (a computation graph for running batches of evaluations with automatic dependency resolution), better training infrastructure, and various utilities I'd been developing in parallel. It was housekeeping, but necessary housekeeping.

And it set the stage for what came next.

---

## Enter the AI

By late January 2026, the tools had caught up with my aspirations. I found myself in conversation with Claude, explaining the issues I'd documented two years prior. The discussion was wide-ranging—we explored Collimator's lazy evaluation approach, debated eager versus lazy execution, and eventually landed on a key insight:

> "The flexibility you want (graph surgery, inserting intervenors) is about **graph structure**, not about eager vs lazy **evaluation**."

This was the crystallizing moment. I didn't need a fancy lazy evaluation framework. I needed explicit structure with eager execution—graphs you could see, debug, and modify, without framework magic between my code and JAX.

We discovered that Equinox already had the right primitives. The `StateIndex`/`State` pattern solved the state management problem elegantly: each component creates its own state indices, and a single `State` object gets threaded through calls. No more parallel `Model` and `ModelState` class hierarchies.

<details>
<summary>The StateIndex pattern</summary>

```python
class Channel(Component):
    """A delay line that stores a queue of values."""

    queue_index: StateIndex  # Created in __init__

    def __init__(self, delay: int, init_value: PyTree):
        initial_queue = (init_value,) * delay
        self.queue_index = StateIndex(initial_queue)

    def __call__(self, inputs, state, *, key):
        queue = state.get(self.queue_index)
        output = queue[0]
        new_queue = queue[1:] + (inputs["input"],)
        state = state.set(self.queue_index, new_queue)
        return {"output": output}, state
```

</details>

The conversation evolved into a specification document—over a thousand lines detailing the new architecture. `Component` as the base class with named ports. `Wire` for connections. `Graph` as a container that is itself a `Component`, enabling hierarchical composition. And the insight that unified everything:

**Cycles in the graph imply iteration.**

A feedback loop—like `mechanics.effector → feedback.input`—isn't something special to handle. It's just a cycle in the graph. When detected at construction time, the graph knows to iterate using `lax.scan`. No separate `Iterator` class needed.

---

## The Implementation

With the spec complete, I handed it to Codex with simple instructions: "Please implement this exactly. Whatever choices remain, make the most elegant and robust choice you can."

Then I went to make dinner.

<details>
<summary>The conversation that kicked it off</summary>

> "I encourage you to do it as well as possible and take your time. I am not in a rush and I want as close to a working product as possible, with all the described features."
>
> "Also, ideally you would write unit tests for everything that you were creating or refactoring... our coverage is abysmal, so we might as well do it now."

</details>

Over the next several hours, Codex methodically worked through the implementation. The core graph infrastructure came first—`feedbax/_graph.py` with shared topological sort utilities, then `feedbax/graph.py` with the full `Component`, `Wire`, and `Graph` classes. Components were converted one by one: channels, mechanics, networks, intervenors. `SimpleFeedback` was rebuilt as an explicit graph with a cycle wire triggering automatic iteration.

The result: 35 files changed, 2386 insertions, 3630 deletions. A net reduction in code, and a fundamentally cleaner architecture.

---

## What Changed

### Before: The Staged Model

```python
class SimpleFeedback(AbstractStagedModel[SimpleFeedbackState]):
    """A feedback controller for sensorimotor tasks."""

    net: AbstractStagedNetwork
    mechanics: Mechanics

    # The model_spec defines execution order as an OrderedDict
    # Interventions require special routing via ModelInput
    # State structure must mirror model structure
```

The execution was sequential. Interventions were threaded through via the `intervene` field of `ModelInput`. The `Iterator` wrapper handled time-stepping. State types had to be defined in parallel with model types.

### After: The Eager Graph

```python
def make_simple_feedback(
    network: Network,
    mechanics: Mechanics,
    feedback_delay: int = 5,
) -> Graph:
    """Construct SimpleFeedback as an explicit graph."""

    feedback = FeedbackChannel(delay=feedback_delay, ...)

    return Graph(
        nodes={
            "feedback": feedback,
            "network": network,
            "mechanics": mechanics,
        },
        wires=(
            Wire("feedback", "output", "network", "feedback"),
            Wire("network", "output", "mechanics", "force"),
            # CYCLE: mechanics -> feedback (implies iteration)
            Wire("mechanics", "effector", "feedback", "input"),
        ),
        input_ports=("target",),
        output_ports=("effector",),
        input_bindings={"target": ("network", "target")},
        output_bindings={"effector": ("mechanics", "effector")},
    )
```

The structure is explicit. Interventions are regular components inserted via graph surgery:

```python
model = model.insert_between(
    node_name="curl_field",
    component=CurlField(),
    source_node="network",
    source_port="output",
    target_node="mechanics",
    target_port="force",
)
```

No special routing. No `ModelInput` hack. The intervention's parameters live in the unified `State`, set by the task before each trial.

---

## Issues Resolved

Remember those issues I wrote in 2024? Here's where they landed:

| Issue | Problem | Resolution |
|-------|---------|------------|
| #10 DAG Architecture | Core architectural tension | Implemented via Component/Wire/Graph |
| #11 Model Input Routing | Awkward `ModelInput(value, intervene)` | Eliminated; intervention params in State |
| #12 Intervenor Type Association | Special-cased intervenors | Intervenors are regular components |
| #13 Abstract Final Pattern | Confusion about `intervenors` field | No special field needed |
| #15 Model Stage Typing | Stage type ambiguity | Explicit graph structure |
| #33 Iterator Interface | `.step` indirection | Cycles imply iteration; no Iterator |

Six issues closed with a single architectural change. The issues directory I maintained for two years turned out to be exactly the context an AI needed to understand the problem deeply and implement the right solution.

---

## What's Next

The cutover is complete for the core architecture, but there's more work ahead.

**Immediate priorities:**
- Run the test suite and fix any integration issues
- Update example notebooks to use the new graph API
- Validate that training still converges on benchmark tasks

**Future directions:**
- **UI for graph editing**: The explicit structure maps cleanly to visual flowchart representations. I've been sketching a web app where you could drag and drop components, wire them together, and export to Python.
- **Closed-loop RL integration**: The `TaskComponent` adapter exists but isn't fully wired through the training API. For reinforcement learning scenarios where the environment responds dynamically, this needs fleshing out.
- **Adaptive-length trials**: Currently impossible with JAX's static shapes, but worth exploring via masking or padding strategies.

---

## Reflections

The moral of this story isn't "AI will implement your architecture for you." It's something quieter: **write things down**.

When I documented those issues in 2024, I didn't know advanced AI coding assistants would exist two years later. I wrote them down because I wanted to understand my own confusion, to have a record of the problems that nagged at me even when I didn't have time to fix them.

That documentation became the specification. The specification became the implementation. And now feedbax has the architecture I always wanted but never had time to build.

The staged model approach wasn't wrong—it was a reasonable choice given my understanding at the time. But architectures evolve, and the willingness to revisit foundational decisions is what keeps a codebase healthy. The new eager graph system isn't just cleaner; it's more honest about what the computation actually is: a graph of components connected by explicit wires, with cycles that naturally imply iteration.

Sometimes the best thing you can do for your future self is leave good notes.

---

*[The implementation was a collaboration between the author and Claude (Anthropic) for specification, and Codex (OpenAI) for implementation. Both AI systems were given full context from documentation written over the preceding two years.]*
