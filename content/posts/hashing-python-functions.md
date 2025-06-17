---
title: "Semantic hashing of python *where*-functions"
created: "2025-06-16"
modified: "2025-06-16"
description: "Hashing the unhashable"
---

Simple test to verify basic parsing. <MarginNote>This is a simple test</MarginNote>

For the past two years, I've developed my machine learning projects with [JAX]() and [Equinox](). 
The basis of JAX's power is [functional]() transformations; the substance is [PyTree]() arguments. <MarginNote>PyTrees [allow us](https://jax.readthedocs.io/en/latest/pytrees.html) to treat arbitrary types and compositions of tree-structured data in a unified way.</MarginNote>

## *Where*-functions

*Where*-functions are just those functions which select one or more nodes from a [PyTree](). What
are they used for, in practice? 

### as pointers for out-of-place updates

They are often used to specify nodes whose values will be replaced: <MarginNote>Why not update the nodes by in-place assignment? Because writing purely functional code means our PyTrees should be immutable.</MarginNote>

```python
import jax
import equinox as eqx

class Foo(eqx.Module):
    bar: dict[str, int]
    baz: tuple[float, float]

    def __call__(self, x: jax.Array):
        # If `Foo` were part of a model, we could transform `x` here, using `bar` and `baz` as parameters.
        ...

tree = Foo(
    dict(a=1, b=2),
    (3.14, 2.718)
)

where_nodes_to_update = lambda tree: (tree.bar['a'], tree.baz)

# Update some parts of the tree
updated_tree = eqx.tree_at(
    where_nodes_to_update,
    tree,
    (5, (6.28, 1.618)),
) # == Foo(bar={'a': 5, 'b': 2}, baz=(6.28, 1.618))
```

<MarginNote>An Equinox `Module` is a type of Python [dataclass](https://docs.python.org/3/library/dataclasses.html), which JAX can manipulate as a PyTree.</MarginNote>

### as training hyperparameters

Another common use case for a *where*-function is to define the parts of a model which will be trained:

```python
where_train = lambda model: (  
    model.net.hidden,  # Train the hidden layer of the neural network module,
    model.net.readout,  # and also train the linear output layer.
)
```

<MarginNote>Our model objects are typically PyTrees whose nodes are of type `eqx.Module`. In this case, our *where*-function assumes that our model possesses whichever nodes it refers to.</MarginNote>

Notice that `where_train` has the flavour of a hyperparameter: on different training runs or phases,
we might want to train different parts of the model. So we might want to encode `where_train` in our
hyperparameter data, similarly to how we would encode the number of training iterations, or the
learning rate.

### for specifying model initialization data

I wrote the library [Feedbax]() for training models of optimal feedback control. 
A Feedbax model is a PyTree of Equinox `Module` nodes, whose leaves encode the parameters of the
model.
When one of those `Module` nodes is called, it is passed another PyTree, whose leaves are JAX arrays which encode the
current system state to be transformed by that node of the model.

Though the system states typically have default starting values, the user may want to provide custom
initializations for some part(s) of the state. 
Of course, we could specify which parts will be initialized using one or more *where*-functions. And
it might seem natural to map from a *where*-function, to the data we'll use to initialize the
respective part of the state.
We do something like this:

```python
from collections.abc import Callable
from jaxtyping import Array, PyTree

# Assume these have already been assigned
default_state: PyTree[Array]  
some_part_init_data: Array
some_other_init_data: Array

# Construct the mapping from parts of the state PyTree, to the data to initialize them with
init_state_mapping: dict[Callable, Array] = {
    (lambda states: states.some_substate.part): some_part_init_data,
    (lambda states: states.some_other_substate.other_part): some_other_init_data,
} 

# Update the default state with the custom init states
state = default_state
for where_func, init_substate in init_state_mapping.items():
    state = eqx.tree_at(where_func, state, init_substate)
```

This works, however we'll encounter some strange behaviour if we try to treat `init_state_mapping`
as a mapping from parts-of-state to state-data. 

For example, if in some other context we want to determine which data will be used to initialize
`states.some_substate.part`, we might try to access it like so:

```python
init_state_mapping[lambda states: states.some_substate.part]
```

This doesn't return `some_part_init_data`, but actually raises a `KeyError`.

Likewise, if we wanted to update `init_state_mapping` to use some different data to initialize part
of the state,

```python
init_state_mapping[lambda states: states.some_substate.part] = some_new_init_data
```

This actually adds a *new* entry to the mapping, rather than replacing the old one.

What causes this strange behaviour?

## Can functions be hashed semantically?

Any Python object that can be [hashed]()[^1] can be used as a key in a `dict`.
[^1]: That is, any object for which the builtin `hash()` will return a unique string.

While Python functions *are* hashable, their hash is essentially just a pointer to their memory address.

Clearly, It's not possible in general to test the semantic equivalence of functions.