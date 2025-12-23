# React Static Frontend - Coding Agent Guide

## Quick Start

### Project outline
This file is designed to be read by coding agents, for the actual current project outline, refer to [README.md](./README.md).

## Project Structure

```
project-name/
├── .claude/
│   ├── agents/          # 11 specialized agents
│   ├── hooks/           # Automation hooks
│   ├── skills/          # Context-aware skills
│   └── settings.json    # Configuration (to be created)
├── dev/                 # Project documentation
│   └── active/          # Latest project active status tracking docs
│   └── react-guide.md   # React patterns & guidelines
├── CLAUDE.md            # This file
└── AGENT_SETUP_VERIFY.md # Quick verification
```

## Project Documentation

The `dev/` directory is for tracking your project:

```
dev/
├── active/                   # Current project status tarcking
├── <feature>-context.md      # Your active feature context
├── <feature>-plans.md        # Your active feature plans
├── <feature>-tasks.md        # Your active feature tasks
```

### What to Track in `dev/`
- Architecture decisions
- Coding conventions
- Setup instructions
- Deployment procedures
- Performance optimizations
- Third-party integrations

## (Claude Code only) Project basic structure included

### Specialized Agents (11)
All agents are tech-agnostic and ready to use:

- **auth-route-debugger** - Debugs authentication route issues
- **auth-route-tester** - Tests authentication routes
- **auto-error-resolver** - Automatically resolves common errors
- **code-architecture-reviewer** - Reviews code architecture
- **code-refactor-master** - Assists with code refactoring
- **documentation-architect** - Creates project documentation
- **frontend-error-fixer** - Fixes frontend errors
- **plan-reviewer** - Reviews implementation plans
- **refactor-planner** - Plans refactoring strategies
- **web-research-specialist** - Conducts web research

### Essential Hooks (2)
- **skill-activation-prompt** - Auto-suggests skills based on your prompts
- **post-tool-use-tracker** - Tracks file changes for context management

### Skills (2)

#### 1. Frontend Dev Guidelines (React + MUI v7)
**Tech Requirements:** React 18+, MUI v7, TanStack Router, TypeScript

Activates when working with:
- `.tsx` files in `src/components/`, `src/pages/`, `src/features/`
- React hooks, components, state management
- MUI styling and components
- TanStack Router patterns

**Features:**
- Modern React patterns (Suspense, lazy loading)
- MUI v7 styling best practices
- TanStack Router integration
- TypeScript best practices
- Performance optimization patterns

#### 2. Skill Developer (Tech-Agnostic)
**Tech Requirements:** None - works with any stack

Activates when:
- Creating new skills
- Modifying `skill-rules.json`
- Working with hook mechanisms

**Features:**
- Skill structure and YAML frontmatter
- Trigger types (keywords, intent patterns, file paths)
- Enforcement levels (block, suggest, warn)
- Hook mechanisms (UserPromptSubmit, PreToolUse)
- Session tracking and 500-line rule

## (Claude Code only) Usage Examples

### Using Skills
Skills activate automatically based on context:

```bash
# Working on a React component
# → Frontend Dev Guidelines skill activates
# → Get React/MUI best practices

# Creating a new skill
# → Skill Developer skill activates
# → Get skill structure guidance
```

### Using Agents
Invoke agents for complex tasks:

```bash
# Refactor a large component
# → "Use code-refactor-master to break down src/components/Dashboard.tsx"

# Review architecture
# → "Use code-architecture-reviewer to check my component structure"

# Document your API
# → "Use documentation-architect to create API docs"
```

### Hook Automation
- **Skill suggestions** appear based on your prompts
- **File tracking** happens automatically in the background
- **Context management** is handled seamlessly

## (Claude Code only) Troubleshooting

### Hooks Not Working
```bash
# Check permissions
ls -la .claude/hooks/

# Should show: -rwxr-xr-x (executable)
# If not: chmod +x .claude/hooks/*.sh
```

### Skills Not Activating
- Check file paths in `skill-rules.json` match your project structure
- Verify file extensions (.tsx, .ts, etc.)
- Ensure skill directory structure is correct

### Agents Not Responding
- Verify agents are in `.claude/agents/`
- Check agent YAML frontmatter syntax
- Ensure agent files are not corrupted

## (Claude Code only) Additional Resources

- **Skill Rules**: Check `.claude/skills/skill-rules.json` syntax

## 🎯 React-Specific Notes

This setup is optimized for:
- **Static React applications** (no backend)
- **Modern React patterns** (hooks, Suspense, lazy loading)
- **MUI v7** styling and components
- **TypeScript** for type safety
- **Component-based architecture**
- **State management** (context, hooks, or external libraries)

### Recommended Project Structure
```
src/
├── components/          # Reusable components
├── pages/               # Page components
├── features/            # Feature modules
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # TypeScript types
├── styles/              # Global styles
└── App.tsx              # Main app component
```
