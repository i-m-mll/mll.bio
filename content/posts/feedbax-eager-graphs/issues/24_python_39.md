# Python 3.9+ Support

**Status**: Nice-to-have
**Original Issue**: #25
**Complexity**: LOW
**Effort**: 2-4 hours

## The Issue

Feedbax uses Python 3.11+ features, mainly for typing:
- `Self` (PEP 673)
- `TypeVarTuple` and `Unpack`
- Improved generic syntax

Some users might need Python 3.9/3.10 for compatibility with other packages.

## What Needs Changing

### 1. Replace `Self` with `typing_extensions.Self`

```python
# Before
from typing import Self

# After
from typing_extensions import Self
```

Or use string annotations: `"SimpleFeedback"` instead of `Self`.

### 2. Replace newer type constructs

```python
# Python 3.11+
type Alias = SomeType

# Python 3.9+
Alias: TypeAlias = SomeType
```

### 3. Use `__future__` annotations

```python
from __future__ import annotations
```

This allows forward references without quotes and defers annotation evaluation.

### 4. Update pyproject.toml

```toml
[project]
requires-python = ">=3.9"
```

## Testing Strategy

1. Create Python 3.9 virtual environment
2. Run type checker (pyright/mypy)
3. Run test suite
4. Check that all imports work

## Recommendation

Low priority unless users request it. The JAX ecosystem generally moves fast and most users have modern Python.

If you do this:
- Use `typing_extensions` for backports
- Add CI testing for Python 3.9 and 3.10
- Document minimum version clearly
