# Blog Post: Feedbax Eager Graph Architecture

This directory contains the blog post and supplementary materials about migrating
feedbax from staged models to eager graphs.

**Location**: `mll.bio/content/posts/feedbax-eager-graphs/`

## Structure

```
feedbax-eager-graphs/
├── INDEX.md                    # This file
├── BLOG_DRAFT.md              # Main blog post draft
├── SPEC_EAGER_MODELS.md       # Architecture specification (input to implementation)
├── README_COMMIT.md           # Commit-specific summary by Codex
├── issues/                    # Original issues written in 2024
│   ├── 00_OVERVIEW.md         # Summary of all issues
│   ├── 10_dag_architecture.md # The core architectural issue
│   ├── 11_model_input_routing.md
│   ├── 33_iterator_interface.md
│   └── ...                    # Other issues
└── logs/
    ├── 00_claude_desktop_context.md       # StateIndex/State research
    ├── 01_claude_code_spec_session.jsonl  # Spec development (Jan 25)
    ├── 02_codex_implementation_session.jsonl  # Implementation (Jan 25)
    └── merge_sessions/                    # Merge-related sessions (Jan 6-8)
        ├── 03_merge_planning_jan6.jsonl   # Initial merge planning
        ├── 04_merge_session_jan6_b.jsonl
        ├── 05_merge_session_jan6_c.jsonl
        ├── 06_merge_session_jan7.jsonl
        ├── 07_merge_session_jan8.jsonl
        ├── a4e42a86-*.jsonl               # merge-experiments worktree sessions
        └── fa65c948-*.jsonl
```

## Log Formats

- **`.md` files**: Human-readable markdown
- **`.jsonl` files**: JSON Lines format (one JSON object per line)
  - Claude Code: Each line is a message exchange with `role`, `content`, `uuid`, etc.
  - Codex: Mixed entry types including `session_meta`, `response_item`, `event_msg`

## File Sizes

| File | Size | Description |
|------|------|-------------|
| `01_claude_code_spec_session.jsonl` | ~8 MB | 415 message exchanges |
| `02_codex_implementation_session.jsonl` | ~6 MB | 3304 entries over ~4 hours |
| `merge_sessions/` (total) | ~1.5 MB | Multiple sessions across Jan 6-8 |

## Reading the Logs

### Claude Code Session
```bash
# View user messages
jq -r 'select(.type=="user") | .message.content' logs/01_claude_code_spec_session.jsonl

# View assistant text responses
jq -r 'select(.type=="assistant") | .message.content[] | select(.type=="text") | .text' \
  logs/01_claude_code_spec_session.jsonl
```

### Codex Session
```bash
# View user prompts
grep '"role":"user"' logs/02_codex_implementation_session.jsonl | \
  jq -r '.payload.content[0].text' | head -20

# View session metadata
head -1 logs/02_codex_implementation_session.jsonl | jq
```

## Future Plans

- [ ] Create cleaned-up versions of speech-to-text messages for easier reading
- [ ] Generate HTML/web version with toggle between raw and cleaned transcripts
- [ ] Extract key conversation highlights for inline quotation in blog post
- [ ] Add decision points / "choice moments" as sidebar annotations

## Timeline

1. **2024 (July)**: Issues written documenting architectural pain points
2. **2026 (Jan 6-8)**: feedbax-experiments merged into feedbax via git subtree
   - Planning session: merge strategy, module mapping, shim structure
   - Execution: Phase 1-3 commits moving and reorganizing code
3. **2026 (Jan 25)**:
   - ~14:00: Claude Desktop session exploring StateIndex pattern
   - ~15:00: Claude Code session developing specification
   - ~18:30: Codex session implementing specification
   - ~22:00: Implementation complete (35 files, 2386+/3630-)

## Key Decision Points (for blog)

These moments from the logs might be worth highlighting:

1. **Eager vs Lazy** (Claude Desktop → spec session): Why explicit graph structure
   beats lazy evaluation for this use case

2. **Cycles = Iteration** (spec session): The insight that feedback loops are just
   cycles in the graph, and cycles naturally imply iteration

3. **Hard Cutover** (Codex session): User chose full migration over gradual transition

4. **StateIndex Adoption** (spec session): Using Equinox's existing pattern rather
   than inventing new state management
