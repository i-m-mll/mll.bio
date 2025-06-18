---
title: Semantic hashing of Python *where*-functions
published: 2025-06-16
updated: 2025-06-16
description: Hashing the unhashable
abstract: |
    It is impossible in general to verify that two functions are equivalent in their semantics/behaviour. 
    On the other hand, tests for equivalence should not generally mean tests for *syntactic* equivalence...
    at least, that's the assumption Python makes. 
    Likewise, Python does not compute hashes of functions from their syntactic structure, but from their memory address.
    So it doesn't make sense to (say) use functions as keys of a `dict` to represent a mapping
    from subtree-accessors (i.e. *where*-functions), to subtree-specific data.
    But what if I very wisely decide I want to do that anyway?
---

For the past two years, I've developed my machine learning projects with [JAX]() and [Equinox](). 
The basis of JAX's power is [functional]() transformations, and how flexibly we can structure
computation graphs with `grad`, `vmap`, and `jit`.
But the *substance* of its power is [PyTree](https://jax.readthedocs.io/en/latest/pytrees.html)
arguments, or the ability to compute over arbitrary types of tree-structured inputs in a unified way.
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

## What's in a function?

Any Python object that can be [hashed]()[^1] can be used as a key in a `dict`.
While a Python function *is* hashable, its hash is based on its *object identity*, which in
CPython (i.e. for almost all Python users) is just its memory address. Thus all of the following
evaluate to `False`:

```python
id(lambda x: x) == id(lambda x: x)
hash(lambda x: x) == hash(lambda x: x)
(lambda x: x) == (lambda x: x)
```
<MarginNote>This is why switching from `dict[Callable, Any]` to `Sequence[tuple[Callable, Any]]`
doesn't help: we still can't run comparisons between the `Callable`s!</MarginNote>

At first this might seem kind of weird. Not only is `lambda x: x` obviously identical to `lambda x:
x` in how it's written (i.e. its syntax), but the two are also obviously identical in how we should expect
them to behave (i.e. their meaning, or semantics). Why wouldn't Python test for equivalence in terms
of either semantics or syntax?

Semantics? That's easy. And by "easy", of course I mean *impossible*: it's a well-known [mathematical
fact](https://en.wikipedia.org/wiki/Rice%27s_theorem) that there's *no* general method by which we can test
whether any two functions will always behave the same way, for all inputs. So if language designers want
tools like `hash` and `==` operators to be general-purpose, and useful for comparing *any* two functions their
users might write in their language, then the behaviour of those tools can't be based on semantics.

Syntax is easier... but probably still not worth it. To see why, check out these different
representations we could use for a syntactic comparison. 

<!--! PROBABLY PUT THESE INTO SOME KIND OF TABBED ELEMENT, or else split them up so they mesh with the attempts I made -->

### Source code

That is, a string literal containing the code as it appears in the source file. This is the most
direct comparison we can make. It's pretty cheap, since we just need to compare the strings
character-by-character until there is a single mismatch. However, it's pretty naive, and hardly
useful. Note that *none* of the following functions will test as equivalent if we compare them
literally, though their syntactic differences are trivial:

```
def func(x):
    return x + 1

def func_with_comment(x):
    return x + 1  # ooowee

def func_with_parens(x):
    return (x + 1)  

def func_without_spaces(x):
    return x+1
```

### Abstract syntax tree

An [Abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)** (AST) is a data
structure specifically intended to represent the syntax of a program. All of the functions in the
previous example would test as having equivalent ASTs. However, most AST implementations represent
the naming of [bound variable](https://en.wikipedia.org/wiki/Free_variables_and_bound_variables) as
part of the syntax. So for example, Python's [`ast`](https://docs.python.org/3/library/ast.html)
considers `lambda x: x` and `lambda y: y` to have different ASTs:

```python
def compare_ast(*code: str):
    tree_dumps = [ast.dump(ast.parse(s)) for s in code]
    return len(set(tree_dumps)) == 1

compare_ast("lambda x: x", "lambda x: (x)")  # True
compare_ast("lambda x: x", "lambda y: y")  # False
```

There are good reasons why we'd want to preserve bound variable names in ASTs, but when testing
for the syntactic equivalence of functions, we generally admit [alpha
equivalence](https://en.wikipedia.org/wiki/Lambda_calculus#Alpha_equivalence), and normalizing our
ASTs to an alpha-equivalent form can require a little work when dealing with arbitrarily complex
functions with nested scopes of bound variables.   

In any case, generating ASTs may be kind of expensive, especially if we don't know beforehand how complex
the things we want to compare will be, as is the case when a language designer is implementing a
general operator like `==`.

### Bytecode

Once Python has parsed the literal source code, it encodes the program as a sequence of lower-level
instructions for the interpreter to run the program. Therefore, bytecode is language-dependent;
bytecode in Python looks different than bytecode for a different interpreted language. Parsing does
involve some semantic interpretation, and unlike an AST, bytecode is not intended as a
representation of syntax. But we can imagine the syntax *of* the resulting bytecode as a practically
abstracted form of the syntax of our source code. 

So in some cases, it might make sense to compare the bytecode of two functions, to test for some
kind of equivalence. 





[^1]: That is, any object for which the builtin `hash()` can take as an input, returning a unique string.