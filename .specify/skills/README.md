# Agent Skills

This directory contains reusable agent skills for the Python CLI Todo Application project. These skills implement the **Reusable Intelligence** principle (Constitution IV) by providing composable, autonomous AI workflows.

## Available Skills

### 1. **test-runner.skill.md**
Automated test execution with coverage analysis.

**Purpose**: Run pytest on tier-specific test files with coverage reports.

**Parameters**:
- `tier`: primary | intermediate | advanced | all
- `coverage_threshold`: Minimum coverage % (default: 85)
- `verbose`: Show detailed output (default: false)
- `fail_fast`: Stop on first failure (default: false)

**Usage**:
```bash
Skill: test-runner --tier primary
Skill: test-runner --tier all --coverage_threshold 90 --verbose true
```

---

### 2. **code-analyzer.skill.md**
Static analysis, complexity metrics, and code quality checks.

**Purpose**: Run black, flake8, mypy and analyze code complexity.

**Parameters**:
- `target`: File or directory to analyze (default: src/)
- `strict`: Use strict mode (default: true)
- `fix`: Auto-fix formatting with black (default: false)

**Usage**:
```bash
Skill: code-analyzer
Skill: code-analyzer --target src/todo/models.py --fix true
```

**Output**: Quality grade (A-F) with specific issues and remediation steps.

---

### 3. **task-validator.skill.md**
Verify task completion against acceptance criteria.

**Purpose**: Validate that a task meets all requirements before marking complete.

**Parameters**:
- `feature`: Feature name (e.g., "todo-core")
- `task_id`: Task ID from tasks.md (e.g., "T1.1")
- `auto_approve`: Auto-mark complete if passed (default: false)
- `verbose`: Show detailed validation (default: true)

**Usage**:
```bash
Skill: task-validator --feature todo-core --task_id T1.1
Skill: task-validator --feature search-filter --task_id T2.3 --auto_approve true
```

**Validation Steps**:
1. File existence
2. Test execution
3. Code quality
4. Acceptance criteria

---

### 4. **data-model-gen.skill.md**
Generate Python data models from spec and constitution.

**Purpose**: Auto-generate Task class, enums, and supporting code.

**Parameters**:
- `feature`: Feature name (e.g., "todo-core")
- `output_file`: Where to write (default: src/todo/models.py)
- `include_validation`: Add validate() methods (default: true)
- `include_serialization`: Add to_dict/from_dict (default: true)

**Usage**:
```bash
Skill: data-model-gen --feature todo-core
Skill: data-model-gen --feature todo-core --output_file src/todo/core_models.py
```

**Generates**:
- Priority, TaskType, RecurrencePattern enums
- Task class with all constitutional fields
- Validation methods (validate, is_overdue)
- Serialization methods (to_dict, from_dict)
- Test stubs

---

### 5. **cli-builder.skill.md**
Generate menu-driven CLI interface from feature spec.

**Purpose**: Auto-generate interactive CLI with tier-organized menus.

**Parameters**:
- `feature`: Feature name (e.g., "todo-core")
- `output_file`: Where to write (default: src/todo/cli.py)
- `include_colors`: Use colorama (default: true)
- `tier`: Build specific tier only (default: "all")

**Usage**:
```bash
Skill: cli-builder --feature todo-core
Skill: cli-builder --feature todo-core --tier primary --include_colors false
```

**Generates**:
- Helper functions (print_header, print_error, get_input, confirm_action)
- Tier-specific menus (primary, intermediate, advanced)
- Feature handlers for each operation
- Main menu and entry point

---

### 6. **wsl-environment-setup.skill.md** 🆕
Automatically detect and configure WSL environments for cross-platform development.

**Purpose**: Handle Node.js/Python version mismatches, PATH configuration, and service startup in WSL.

**Parameters**:
- `project_type`: nodejs | python | fullstack | auto-detect
- `required_node_version`: Minimum Node.js version (default: "20.9.0")
- `required_python_version`: Minimum Python version (default: "3.9")
- `auto_fix`: Automatically apply fixes (default: true)
- `prefer_windows_node`: Use Windows Node.js over WSL (default: true)
- `services`: List of services to start (e.g., ["backend", "frontend"])

**Usage**:
```bash
Skill: wsl-environment-setup --project_type auto-detect
Skill: wsl-environment-setup --project_type fullstack --services ["backend", "frontend"]
Skill: wsl-environment-setup --project_type nodejs --required_node_version "18.0.0"
```

**Features**:
- ✅ Auto-detects WSL environment (WSL 1, WSL 2, or native Linux)
- ✅ Identifies Node.js version mismatches between WSL and Windows
- ✅ Applies smart fixes (Windows Node.js PATH or NVM installation)
- ✅ Validates Python version requirements
- ✅ Converts Windows paths to WSL paths in .env files
- ✅ Starts multiple services in background with health checks
- ✅ Generates comprehensive setup report with URLs

**Handles Common Issues**:
- Node.js version too old in WSL
- PATH not persisting across sessions
- WSL netstat not showing Windows-bound ports
- Module not found errors (npm/npx)
- Slow NVM installation timeouts

**Based On**: PHR `007-wsl-nodejs-upgrade-project-startup.general.prompt.md` (2025-12-31)

---

## How to Use Skills

### Invoking a Skill

Skills are invoked by the AI assistant during development. When you see:

```
I'm going to use the test-runner skill to validate coverage...
```

The assistant is autonomously executing the skill workflow.

### Skill Workflow

1. **Load skill definition** from .md file
2. **Parse parameters** provided by assistant
3. **Execute steps** defined in skill
4. **Generate report** with results
5. **Return to assistant** for next action

### Creating New Skills

To create a new skill:

1. Copy an existing skill as template
2. Define clear **Purpose** and **Parameters**
3. Document **Execution Steps** (numbered, detailed)
4. Define **Acceptance Criteria** (what "done" means)
5. Specify **Dependencies** and **Error Handling**
6. Add **Usage Examples**

## Skill Best Practices

✅ **Self-contained**: Include all context and instructions
✅ **Parameterized**: Accept configuration for different contexts
✅ **Documented**: Clear purpose, inputs, outputs, examples
✅ **Idempotent**: Safe to run multiple times
✅ **Actionable**: Provide specific remediation for failures
✅ **Testable**: Define acceptance criteria

## Integration with Slash Commands

Skills are invoked by slash commands:

| Slash Command | Primary Skill(s) Used |
|---------------|----------------------|
| `/test-tier` | test-runner |
| `/build` | code-analyzer, test-runner |
| `/coverage` | test-runner |
| `/lint-all` | code-analyzer |
| `/validate-tier` | task-validator, code-analyzer, test-runner |

## Constitutional Requirement

Per **Constitution Principle IV (Reusable Intelligence)**:

> "Development MUST leverage Claude Code's agent capabilities to create reusable, composable intelligence."

Skills implement this principle by:
- Eliminating manual repetitive work
- Ensuring consistency across codebase
- Capturing institutional knowledge
- Accelerating development
- Providing auditable, reproducible workflows

## Related Directories

- `.specify/templates/commands/` - Slash command definitions
- `.specify/blueprints/` - Code generation templates
- `history/prompts/` - Prompt history records (PHRs)

---

**Generated**: 2025-12-06
**Constitution Version**: 2.1.0
**Principle**: IV. Reusable Intelligence & Agent-Driven Development
