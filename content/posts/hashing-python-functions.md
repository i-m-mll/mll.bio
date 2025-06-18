---
title: Semantic hashing of Python *where*-functions
published: 2025-06-16
updated: 2025-06-16
description: Hashing the unhashable
abstract: git adIn general, it is not possible to verify that two functions are equivalent in their semantics/behaviour. 
---

For the past two years, I've developed my machine learning projects with [JAX]() and [Equinox](). 
The basis of JAX's power is [functional]() transformations, and how flexibly we can structure
computation graphs with `grad`, `vmap`, and `jit`.
But the *substance* of its power is [PyTree](https://jax.readthedocs.io/en/latest/pytrees.html)
arguments, which allow us to compute over arbitrary types of tree-structured inputs in a unified way.
To be clear: "a PyTree" is code for "some nested composition of nodes, which JAX[^1] knows how to
treat like any other tree because it's been told how to flatten and unflatten them".

## *Where*-functions

*Where*-functions are just functions which select one or more nodes from a PyTree. What
are they used for? 

### As specs for out-of-place updates

They are often used to specify nodes whose values will be replaced: 

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

### As training hyperparameters

Another common use case for a *where*-function is to define the parts of a model which will be trained:
<MarginNote>Our model objects are typically PyTrees whose nodes are of type `eqx.Module`. In this case, our *where*-function assumes that our model possesses whichever nodes it refers to.</MarginNote>
```python 
where_train = lambda model: (  
    model.layer1,  
    model.layer3, 
)
```

Notice that `where_train` has the flavour of a hyperparameter: on different training runs or phases,
we might want to train different parts of the model. So we might want to encode `where_train` in our
hyperparameter data, similarly to how we would encode the number of training iterations, or the
learning rate. 

However, there are issues with trying to encode functions as data.

### For specifying model initializations

<MarginNote> This is the approach I used when designing [Feedbax]() </MarginNote>
Our models may be PyTrees of callable `Module`s. The arguments we pass to these modules may also be
PyTrees of data, or states. 

States typically have default initializations, but the user may want to provide custom
initializations for some part(s) of the state, without needing to construct the entire PyTree
themselves. 
We might provide the custom intitializations as a mapping from one or more *where*-functions, which
specify the part(s) of the state to initialize, to the respective data to initialize with:

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

This does work, but we'll encounter some strange behaviour if we try to treat `init_state_mapping`
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

Any Python object that can be [hashed]()[^2] can be used as a key in a `dict`.
[^2]: That is, any object for which the builtin `hash()` will return a unique string.

While Python functions *are* hashable, their hash is essentially just a pointer to their memory address.

Clearly, It's not possible in general to test the semantic equivalence of functions.

Switching to `tuple[Callable, data]` might seem to work for specifying initializations, but it
doesn't really help because `lambda x: x != lambda x: x`.