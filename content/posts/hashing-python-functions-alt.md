---
title: Hashing functions by what they select
published: 2025-06-16
updated: 2025-06-16
description: When identity isn't enough
abstract: |
    It is [impossible](https://en.wikipedia.org/wiki/Rice%27s_theorem) in general to verify the
    equivalence of [functions](https://en.wikipedia.org/wiki/Computable_function) in terms of
    their input-output behaviour, or *semantics*. For different practical reasons, many programming
    languages, including Python, also don't evaluate functions' equivalence in terms of their code
    structure, or *syntax*. Instead, Python computes hashes and equivalence (or, uniqueness)
    of functions based solely on their memory address.
    So it doesn't make sense to use a `dict` to map from subtree selectors to respective node data,
    when you want the uniqueness of those keys to be decided by what subtree they select.
    But what if I very wisely insist I must build such a `dict` anyway?
    However misguided, it turns out solving this problem helps us with a more practical one:
    serialising hyperparameters for training runs, when those hyperparameters happen to be
    selectors.
tags: python, jax, equinox, hashing, machine learning
---

<NoteScope>
For the past two years, I've developed my machine learning projects with [JAX](https://jax.readthedocs.io/) and [Equinox](https://docs.kidger.site/equinox/).
The basis of JAX's power is how flexibly we can compose our computation graphs by writing in a
[functional](https://en.wikipedia.org/wiki/Functional_programming) paradigm, using transformations
like [`grad`](https://jax.readthedocs.io/en/latest/_autosummary/jax.grad.html), [`vmap`](https://jax.readthedocs.io/en/latest/_autosummary/jax.vmap.html), and [`jit`](https://jax.readthedocs.io/en/latest/_autosummary/jax.jit.html). But the *substance* of its power is
[PyTrees](https://jax.readthedocs.io/en/latest/pytrees.html), or the ability to transform
over arbitrary types of tree-structured inputs in a unified way.
<MarginNote target="PyTree">To be clear: "a PyTree" is code for "some nested composition of nodes, which JAX knows how to treat like any other tree because it's been told how to flatten and unflatten the nodes". Technically every Python object is a PyTree, even if it is treated as just a single leaf.</MarginNote>
</NoteScope>

## Subtree selectors

A *subtree selector function* takes a PyTree and returns a different PyTree, composed of one or more nodes selected from the input. We'll call these *where-functions* for short—both because they specify *where* in a tree to operate, and because it's fun to say.

One use case is to edit the nodes of a PyTree out-of-place. Suppose we have an instance of some data type:

<NoteScope>

```python
import jax
import equinox as eqx
from equinox import Module

class Foo(Module):
    bar: dict[str, int]
    baz: tuple[float, float]

    def __call__(self, x: jax.Array):
        # If `Foo` were part of a model, we could transform `x` here,
        # using `self.bar` and `self.baz` as parameters.
        ...

tree = Foo(
    dict(a=1, b=2),
    (3.14, 2.718)
)
```
<MarginNote target="(Module)">An Equinox `Module` is a type of Python [dataclass](https://docs.python.org/3/library/dataclasses.html), which JAX can manipulate as a PyTree.</MarginNote>
</NoteScope>

A where-function lets us specify the nodes whose values will be replaced:

```python
where_nodes_to_update = lambda tree: (tree.bar['a'], tree.baz)

# Update some parts of the tree
updated_tree = eqx.tree_at(
    where_nodes_to_update,
    tree,
    (5, (6.28, 1.618)),
)

updated_tree
>> Foo(bar={'a': 5, 'b': 2}, baz=(6.28, 1.618))
```

<NoteScope>
Similarly, we can use selectors to specify partial initializations of model states. When working with JAX, we typically compose models as trees of Equinox `Module` objects. Each module node may have leaves which are its parameters; it may also be callable, and specify a transformation of the model state. But to keep the model purely functional, state cannot live inside the modules themselves—it must be passed around separately.
<MarginNote>This is the approach I used when designing [Feedbax](https://github.com/i-m-mll/feedbax).</MarginNote>
</NoteScope>

States typically have default initializations, but users may want to provide custom initializations for some part(s) of the state, without needing to construct the entire PyTree themselves. We might provide the custom initializations as a mapping from where-functions—which specify the part(s) of the state to initialize—to the respective data to initialize with.

Suppose we are given a PyTree of default model states (i.e. arrays), and we'd like to
initialize some of its leaves using custom arrays. For each leaf we want to initialize, we could pair its
where-function with an appropriate array value. But maybe we don't know beforehand exactly which
leaves we'll want to initialize, so we'd like a general tool that can perform the initialization for
us in any case:

```python
from collections.abc import Callable
from jaxtyping import Array, PyTree

def replace_nodes(tree: PyTree, spec: Sequence[tuple[Callable, Any]]):
    for where_func, node_value in spec:
        tree = eqx.tree_at(where_func, tree, node_value)
    return tree
```

This works, so long as the structure of the node
values matches the structure of their respective selector's return value. However, of course
some of our selectors might pick out trees containing redundant leaves from `tree`, and in
that case we'll end up pointlessly replacing the same leaf more than once. Perhaps it is better to assume in
this case that our selectors will specify individual, unique leaves (or at least, trees of
non-intersecting subsets of leaves). So, suppose instead we use the function:

```python
def replace_leaves(tree: PyTree, spec: Sequence[dict[Callable, Any]]):
    for where_func, leaf_value in spec.items():
        tree = eqx.tree_at(where_func, tree, leaf_value)
    return tree
```

Now we can specify a mapping between selectors that pick out unique leaves, and the arrays
we should replace those leaves with:

```python
# Assume these have already been assigned
default_state: PyTree[Array]
some_part_init_data: Array
some_other_init_data: Array

# Construct the mapping from parts of the state PyTree, to the data to initialize them with
init_state_spec: dict[Callable, Array] = {
    (lambda state: state.some_substate.part): some_part_init_data,
    (lambda state: state.some_other_substate.other_part): some_other_init_data,
}

# Update the default state with the custom init states
initial_state = replace_nodes(default_state, init_state_spec)
```

This does work, but all is not what it seems. We'll encounter some strange behaviour if we assume
that `init_state_spec` treats its where-function keys as unique, *because they pick out unique
leaves*.

For example, if in some other context we want to determine which data will be used to initialize
`states.some_substate.part`, we might try to access it like so:

```python
init_state_mapping[lambda states: states.some_substate.part]
```

But this doesn't return `some_part_init_data`! It actually raises a `KeyError`.

Likewise, if we already have some `init_state_spec` and want to update it to use some different data
for part of the state, we might try this:

```python
init_state_mapping[lambda states: states.some_substate.part] = some_new_init_data
```

But this actually adds a *new* entry to the mapping, rather than replacing the old one.

What is responsible for this weirdness? Well, Python accesses and assigns `dict` entries based on
the uniqueness of a key's *hash*... and this doesn't work like you might think, or like I
once naively hoped, when the key happens to be a function.

## What's in a function?

Any Python object that can be [hashed](https://docs.python.org/3/library/functions.html#hash)[^1] can be used as a key in a `dict`.
While a Python function *is* hashable, its hash is based on its *object identity*, which in
CPython (i.e. for almost all Python users) is just its memory address. For example, **all** of the following
expressions evaluate to `False`:

```python
# Explicitly compare by object identity
id(lambda x: x) == id(lambda x: x)
(lambda x: x) is (lambda x: x)

# Implicitly compare by object identity
(lambda x: x) == (lambda x: x)

# Explicitly compare by hash
hash(lambda x: x) == hash(lambda x: x)
```

Since these will evaluate `False` for any function, and since where-functions are of course "any
function", this example is also `False`:

```python
hash(lambda model: model.some_layer) == hash(lambda model: model.some_layer)
```

At first this might seem kind of weird. Not only is `lambda model: model.some_layer` obviously identical to `lambda model:
model.some_layer` in how it's written (i.e. its structure, or syntax), but the two are also obviously identical in how we should expect
them to behave (i.e. their meaning, or semantics).
Actually, in the case of a selector, syntax and semantics are pretty closely aligned in general:
once we know its syntax then we can be pretty certain about what it is going to return, and vice
versa, since it's just performing some simple accesses of parts of a data structure.

If functions were hashed in terms of either syntax or semantics, then our selectors'
uniqueness would be determined in the way we want. Seems pretty useful!
So why wouldn't Python evaluate hashes or equivalence, in terms of either syntax or semantics?

Semantics? That's easy. And by "easy", of course I mean *impossible*: it's a well-known [mathematical
fact](https://en.wikipedia.org/wiki/Rice%27s_theorem) that there's *no* general method by which we can test
whether any two functions will always behave the same way, for all inputs. So if programming language designers want
tools like `hash` and `==` operators to be general-purpose, and useful for comparing *any* two functions their
users might write, then those tools can't be based on semantics.

We could also try to evaluate equivalence in terms of *syntax*, which is the structure of the
function's code. This is at least possible, when we have access to the code. But for arbitrary functions it can get expensive: parsing source, building ASTs, and normalizing for trivial differences like variable names. Perhaps it's enough most of the time to know that two functions aren't literally identical in memory. Anyway, that's what Python assumes!

Since `dict` uses `hash` to determine the uniqueness of keys, and the `hash` of a selector
is not determined by what it picks out, `dict` cannot see our selectors the way we see them.

## Using selectors as `dict` keys

Once upon a time I decided that I really wanted to be able to use where-functions as `dict` keys.
I realized that
selectors do not hash in terms of the part(s) of a PyTree they access, and decided
to make a custom type of `dict` that did not directly treat them as keys, but
instead converted them to an intermediate value which *would* hash on my terms.
And for that, I needed a function that takes a where-function as input, and returns a hashable
representation of its syntax as output.

I searched for a function `where_func_to_str` that would convert a selector to a string.
I expected it to behave like so:

```python
where_func_to_str(lambda state: state.layer2)
>> "layer2"

where_func_to_str(lambda s: s.some_substate.layer1)
>> "some_substate.layer1"
```

And maybe I could also get it to work for slightly more complex cases:

```python
where_func_to_str(lambda state: (state.layer2, state.layer3))
>> ("layer2", "layer3")
```

Note that the name of the bound variable ("state", "s", whatever) does not matter here. What is important is that
given some PyTree, whatever its name, we are accessing some part(s) of it, whose names *are* given.

I hadn't yet imagined how I would handle all possible selectors. For example, this would be
no good:

```python
where_func_to_str(lambda state: [state.layer2, state.layer3])
>> ["layer2", "layer3"]
```

That's because lists, including `["layer2", "layer3"]`, *aren't hashable*. They can't be used as
keys! Nor can `dict`s or `set`s. Tuples *are* hashable, so `("layer2", "layer3")` is fine as a dict key. However, assuming we do find a `where_func_to_str` that works like we want, we'll need to make sure our selectors return PyTrees which are hashable when their leaves are replaced with strings.

On my quest for a selector-based `dict`, I made three attempts to write a `where_func_to_str`. But
let's start with an example that will not work.

#### Won't work: literal source code

That is, a string literal containing the code as it appears in the source file. This is the most
direct comparison we can make. It's pretty cheap, since we just need to compare the strings
character-by-character until there is a single mismatch. However, it's pretty naive, and hardly
useful. Note that *none* of the following functions will test as equivalent if we compare them
literally, though their syntactic differences are trivial:

```python
def func(x):
    return x + 1

def func_with_comment(x):
    return x + 1  # ooowee

def func_with_parens(x):
    return (x + 1)

def func_without_spaces(x):
    return x+1
```

#### Also won't work well: abstract syntax tree

An [**Abstract syntax tree**](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) is a data
structure specifically intended to represent the syntax of a program. Python's
[`ast`](https://docs.python.org/3/library/ast.html) implementation would say that all of the functions in the
previous example have equivalent ASTs. However it, like most AST implementations, includes
the naming of [bound variables](https://en.wikipedia.org/wiki/Free_variables_and_bound_variables) as
part of the syntax. So for example:

```python
def compare_ast(*code: str):
    tree_dumps = [ast.dump(ast.parse(s)) for s in code]
    return len(set(tree_dumps)) == 1

compare_ast("lambda x: x", "lambda x: (x)")  # True
compare_ast("lambda x: x", "lambda y: y")  # False; the only difference is a bound variable name
```

There are good reasons why we'd want to preserve bound variable names in ASTs, but when testing
for the syntactic equivalence of functions, we generally admit [alpha
equivalence](https://en.wikipedia.org/wiki/Lambda_calculus#Alpha_equivalence), and normalizing our
ASTs to an alpha-equivalent form can require a little work when dealing with arbitrarily complex
functions with nested scopes of bound variables.

In any case, generating ASTs may be kind of expensive, especially if we don't know beforehand how complex
the things we want to compare will be, as is the case when a language designer is implementing a
general operator like `==`.

### First actual attempt: from bytecode

Once Python has parsed the literal source code, it encodes the program as a sequence of lower-level
instructions for the interpreter to run the program. Therefore, bytecode is language-dependent;
bytecode in Python looks different than bytecode for a different interpreted language. Parsing does
involve some semantic interpretation, and unlike an AST, bytecode is not mainly intended as a
representation of syntax. But we can imagine the syntax *of* the resulting bytecode as a practically
abstracted form of the syntax of our source code.

So in some cases, it might make sense to compare the bytecode of two functions, to test for some
kind of equivalence.

```python
from collections.abc import Callable
import dis


def get_where_str(where_func: Callable) -> str:
    """
    Returns a string representation of the (nested) attributes accessed by a function.

    Only works for functions that take a single argument, and return that argument,
    or a single (nested) attribute accessed from the argument.
    """
    bytecode = dis.Bytecode(where_func)
    return ".".join(
        instr.argrepr for instr in bytecode
        if instr.opname == "LOAD_ATTR"
    )
```

But this is inflexible. It only works for a single attribute access chain. To make it work for arbitrarily complex subtrees would require much more elaborate bytecode parsing.


### Second attempt: from node paths via `jax.tree`

My second attempt used the PyTree facilities from JAX+Equinox to use the selector to modify the respective nodes of the PyTree, then figure out what their paths are, and return those. The paths are certainly one-to-one with their string representations.

While this method is in some ways more flexible than using bytecode, it was even slower. Also it
required access to the tree we will be using the selector on (or more technically, one that
shares at least all the same node paths accessed by the selector).

```python
from collections.abc import Callable

import equinox as eqx
import jax.tree as jt
from jaxtyping import PyTree


class _NodeWrapper:
    def __init__(self, value):
        self.value = value


class _NodePath:
    def __init__(self, path):
        self.path = path

    def __iter__(self):
        return iter(self.path)


def where_func_to_paths(where: Callable, tree: PyTree):
    """
    Similar to `get_where_str`, but:

    - returns node paths, not strings;
    - works for `where` functions that return arbitrary PyTrees of nodes;
    - works for arbitrary node access (e.g. dict keys, seq. indices)
      and not just attribute access.

    Limitations:

    - requires a PyTree argument;
    - assumes the same object does not appear as multiple nodes in the tree;
    - if `where` specifies a node that is a subtree, it cannot also specify a node
      within that subtree.

    See [this issue](https://github.com/i-m-mll/feedbax/issues/14).
    """
    tree = eqx.tree_at(where, tree, replace_fn=lambda x: _NodeWrapper(x))
    id_tree = jt.map(id, tree, is_leaf=lambda x: isinstance(x, _NodeWrapper))
    node_ids = where(id_tree)

    paths_by_id = {node_id: path for path, node_id in jt.leaves_with_path(
        jt.map(
            lambda x: x if x in jt.leaves(node_ids) else None,
            id_tree,
        )
    )}

    paths = jt.map(lambda node_id: _NodePath(paths_by_id[node_id]), node_ids)

    return paths
```

### Third attempt: representation tracer object

The third solution, and the best one I've found so far, is based on passing an instance of a special class to the where-function.

By defining the attribute-access and item-access behaviour for this class, we can easily construct a
tree-of-strings representation of the structure of the selector's return value. This is the most flexible method, and also by
far the fastest.

```python
from collections.abc import Callable

import jax.tree as jt
from jaxtyping import PyTree


class _WhereStrConstructor:

    def __init__(self, label: str = ""):
        self.label = label

    def __getitem__(self, key: Any):
        if isinstance(key, str):
            key = f"'{key}'"
        elif isinstance(key, type):
            key = key.__name__
        return _WhereStrConstructor("".join([self.label, f"[{key}]"]))

    def __getattr__(self, name: str):
        sep = "." if self.label else ""
        return _WhereStrConstructor(sep.join([self.label, name]))


def _get_where_str_constructor_label(x: _WhereStrConstructor) -> str:
    return x.label


def where_func_to_attr_str_tree(where: Callable) -> PyTree[str]:
    """Similar to `get_where_str` and `where_func_to_paths`, but:

    - Avoids complicated logic of parsing bytecode, or traversing pytrees;
    - Works for `where` functions that return arbitrary PyTrees of node references;
    - Runs significantly (10+ times) faster than the other solutions.
    """

    try:
        return jt.map(_get_where_str_constructor_label, where(_WhereStrConstructor()))
    except TypeError:
        raise TypeError("`where` must return a PyTree of node references")
```

This still isn't super efficient—about 10 µs per call, for the data I'm working with—but I
only need to do a small number of these operations every training iteration, so for my purposes it
was okay.

Now that we have a decent `where_func_to_str`, we can construct the custom `dict` that effectively
uses selectors as keys. The implementation is in the appendix, since it's less about selectors themselves and more about Python dict mechanics.

## Serialisation of selectors

Another common use case for a where-function is to define the parts of a model which will be trained:
<MarginNote>Our model objects are typically PyTrees whose nodes are of type `eqx.Module`. In this case, our selector assumes that our model possesses whichever nodes it refers to.</MarginNote>
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

Of course, it can be kind of inefficient to try to encode functions as data (e.g. an AST). And if we
want our encoding to reflect the *effect* (i.e. semantics) of the function rather than simply the
way it was coded, there is no general solution. But since we're working with selectors in
particular, we can just use `where_func_to_str` to convert them to an equivalent representation
which is easily serialisable:

```python
where_func_to_str(where_train)
>> ('layer1', 'layer3')
```

Of course, we'll probably want to deserialise this representation and convert it back into a
where-function, like when loading hyperparameters from disk to start a training run. The
reverse transformation is straightforward for attribute accesses:

```python
from collections.abc import Callable
from operator import attrgetter

from jaxtyping import PyTree


def attr_str_tree_to_where_func(tree: PyTree[str, 'T']) -> Callable[[PyTree], PyTree[Any, 'T']]:
    """Reverse transformation to `where_func_to_attr_str_tree`.

    Takes a PyTree of strings describing attribute accesses, and returns a function
    that returns a PyTree of attributes.

    Note: This handles attribute accesses only. Extending to handle item accesses
    (e.g. dict keys, list indices) would require parsing the bracket notation
    from the string representation.
    """
    getters = jt.map(lambda s: attrgetter(s), tree)

    def where_func(obj):
        return jt.map(lambda g: g(obj), getters)

    return where_func
```

## Conclusion

The key insight is that while Python can't hash arbitrary functions by their behaviour (impossible) or their syntax (expensive), *subtree selectors* are simple enough that we can trace their execution with a custom object and capture exactly which paths they access. This gives us a hashable representation that matches our intuition about when two selectors are "the same."

I found this pretty interesting, and I learned a lot. If you've read this far and think I'm
missing something obvious or have taken the wrong approach, I'd be glad to hear about it.

## Appendix: a `dict` that uses accessor functions as keys

We'll start by defining the general case of a `dict` that which transforms its keys before trying to hash them.

```python
from abc import abstractmethod
from collections import OrderedDict
from collections.abc import MutableMapping
from typing import Generic, TypeVar, overload


T = TypeVar("T")
KT1 = TypeVar("KT1")
KT2 = TypeVar("KT2")
VT = TypeVar("VT")

class AbstractTransformedOrderedDict(MutableMapping[KT2, VT], Generic[KT1, KT2, VT]):
    """Base for `OrderedDict`s which transform keys when getting and setting items.

    It stores the original keys, and otherwise behaves (e.g. when iterating)
    as though they are the true keys.

    This is useful when we want to use a certain type of object as a key, but
    it would not be hashed properly by `OrderedDict`, so we need to transform
    it into something else.

    Based on https://stackoverflow.com/a/3387975
    """
    store: OrderedDict[KT1, tuple[KT2, VT]]

    def __init__(self, *args, **kwargs):
        self.store = OrderedDict()
        self.update(OrderedDict(*args, **kwargs))

    def __getitem__(self, key: KT1 | KT2) -> VT:
        k = self._key_transform(key)
        return self.store[k][1]

    @overload
    def get(self, key: KT1 | KT2) -> VT | None: ...

    @overload
    def get(self, key: KT1 | KT2, default: T) -> VT | T: ...

    def get(self, key, default=None):
        k = self._key_transform(key)
        if k in self.store:
            return self.store[k][1]
        else:
            return default

    def __setitem__(self, key: KT2, value: VT):
        self.store[self._key_transform(key)] = (key, value)

    def __delitem__(self, key: KT2):
        del self.store[self._key_transform(key)]

    def __iter__(self):
        for key in self.store:
            yield self.store[key][0]

    def __len__(self) -> int:
        return len(self.store)

    def tree_flatten(self):
        """The same flatten function used by JAX for `dict`"""
        return tuple(self.values()), tuple(self.keys())

    @classmethod
    def tree_unflatten(cls, keys, values):
        return cls(zip(keys, values))

    @abstractmethod
    def _key_transform(self, key: KT1 | KT2) -> KT1:
        # TODO: Subclass and implement the desired transformation.
        ...
```

Finally, here is the dict that can use accessor function lambdas as keys:

```python
from collections.abc import Callable
from typing import TypeVar

import equinox as eqx
import jax.tree as jt
from jax.tree_util import register_pytree_node_class
from jaxtyping import Array, PyTree


T = TypeVar('T')


def _where_to_str(where: Callable) -> str:
    """Return a single string representing an accessor function."""
    terms = where_func_to_attr_str_tree(where)
    if isinstance(terms, str):
        where_str = terms
    else:
        where_str = ", ".join(jt.leaves(terms))
    return where_str

@register_pytree_node_class
class WhereDict(AbstractTransformedOrderedDict[str, Callable[[PyTree], Any], T]):
    """An `OrderedDict` that allows use of accessor functions as keys.

    In particular, keys can be callables (functions/lambdas) that take a single argument,
    and return a PyTree of leaves, as visited by attribute/item accesses.

    Functions are parsed to strings, which can be used interchangeably as keys.
    For example, the following return the same value when `init_spec` is a `WhereDict`:

    > init_spec[lambda state: state.mechanics.effector]
    > init_spec['mechanics.effector']

    Finally, a `tuple[Callable, str]` may also be provided as a key, for cases where
    different unique entries must be included for the same callable. For example,
    the following are equivalent:

    > init_spec[(lambda state: state.mechanics.effector, "first")]
    > init_spec['mechanics.effector#first']

    Note that the hash symbol `#` is used as a delimiter in the string representation.

    ??? Note "Performance"
        For typical initialization mappings (1-10 items) construction is on the order
        of 50x slower than `OrderedDict`. Access is about 2-20x slower, depending
        whether indexed by string or by callable.

        However, we only need to do a single construction and a single access of
        init_spec per batch/evaluation, so performance shouldn't matter too much in
        practice: the added overhead is <50 us/batch, and a batch normally takes
        at least 20,000 us to train.
    """

    def _key_transform(self, key: str | Callable | tuple[Callable, str]) -> str:
        return self.key_transform(key)

    @staticmethod
    def key_transform(key: str | Callable | tuple[Callable, str]) -> str:

        if isinstance(key, str):
            pass
        elif isinstance(key, Callable):
            where_str = _where_to_str(key)
            return where_str
        elif isinstance(key, tuple):
            if not isinstance(key[0], Callable) or not isinstance(key[1], str):
                raise ValueError("Each `WhereDict` key should be supplied as a string, "
                                 "a callable, or a tuple of a callable and a string")
            where_str = _where_to_str(key[0])
            return '#'.join([where_str, key[1]])
        else:
            raise ValueError("Each `WhereDict` key should be supplied as a string, "
                             "a callable, or a tuple of a callable and a string")
        return key

    def __repr__(self):
        return eqx.tree_pformat(self)
```

[^1]: That is, any object the builtin function `hash` can take as an input, [returning a unique
    string](https://en.wikipedia.org/wiki/Hash_function).
