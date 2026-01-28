# Improve Musculoskeletal Geometry Modeling

**Status**: Feature enhancement
**Original Issue**: #33
**Complexity**: MEDIUM-HIGH
**Effort**: 1-2 weeks

## The Problem

Current muscle models in feedbax (Virtual Muscle variants) are limited to simple geometry:
- Muscles attach at fixed points
- Moment arms are computed from joint angles via simple formulas
- No muscle wrapping around bones/joints

MotorNet has a more flexible approach with wrapping objects.

## What MotorNet Does

From their documentation:
- **Wrapping objects**: Muscles can wrap around cylinders, spheres representing bones
- **Obstacle sets**: Define geometry that muscles wrap around
- **Path computation**: Muscle length/velocity computed from wrapping path
- **Moment arms**: Derived from wrapping geometry, not hardcoded

This enables:
- Anatomically realistic muscle paths
- Variable moment arms through range of motion
- Multi-joint muscles with realistic length changes

## Implementation Approach

### Phase 1: Wrapping Primitives

```python
class WrappingObject(Module):
    """Base class for objects that muscles wrap around."""

    @abstractmethod
    def wrap_path(self, origin: Array, insertion: Array) -> MusclePath:
        """Compute muscle path wrapping around this object."""
        ...

class WrapCylinder(WrappingObject):
    center: Array  # 3D position
    axis: Array    # Cylinder axis direction
    radius: float

class WrapSphere(WrappingObject):
    center: Array
    radius: float
```

### Phase 2: Muscle Path Computation

```python
class MuscleGeometry(Module):
    """Defines the geometric path of a muscle."""

    origin: Array  # Or callable for state-dependent attachment
    insertion: Array
    wrapping: Sequence[WrappingObject]

    def compute_path(self, skeleton_state: SkeletonState) -> MusclePath:
        """Compute full muscle path given skeleton configuration."""
        # Transform attachment points to current joint configuration
        # Compute wrapping around each obstacle
        # Return path with length, velocity, moment arms
```

### Phase 3: Integration with Muscle Models

- `AbstractMuscle.compute_kinematics` takes geometry and skeleton state
- Length, velocity, moment arms come from `MuscleGeometry.compute_path`
- Existing force-length-velocity functions unchanged

### Phase 4: Skeleton Integration

- `AbstractSkeleton` provides methods to transform points to world frame
- Joint-dependent wrapping object positions
- Forward/inverse kinematics for attachment points

## Complexity Notes

**The hard parts:**
1. Efficient wrapping path computation (may need iterative solver)
2. Differentiable wrapping (for gradients to flow through)
3. Handling edge cases (muscle not wrapping, multiple solutions)
4. Testing against anatomical ground truth

**Helpful resources:**
- MotorNet source code
- OpenSim documentation on muscle wrapping
- Papers on computational muscle path algorithms

## Scientific Value

Enables:
- Realistic multi-joint arm models
- Finger/hand models with complex tendon routing
- Validation against biomechanics literature
- More accurate muscle force predictions

## Recommendation

This is valuable but non-trivial. Consider:
1. Start with simple cylinder wrapping for a single-joint muscle
2. Validate against known moment arm curves
3. Extend to multi-obstacle paths
4. Add to `MuscledArm` as optional geometry mode

Can be done incrementally without breaking existing simple geometry.
