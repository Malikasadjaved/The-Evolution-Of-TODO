# WSL Environment Setup Skill

## Purpose
Automatically detect and configure WSL (Windows Subsystem for Linux) environments for Node.js/Python projects. This skill handles Node.js version mismatches, PATH configuration, and environment-specific startup sequences to ensure seamless development across Windows and WSL environments.

## Metadata
- **Category**: Environment Setup
- **Complexity**: Intermediate
- **Prerequisites**: WSL installed, Windows file system accessible via `/mnt/`
- **Applicable Projects**: Any Node.js, Python, or full-stack project running in WSL

## Parameters

### Required
- `project_type` (string): Type of project - `nodejs`, `python`, `fullstack`, or `auto-detect`

### Optional
- `required_node_version` (string): Minimum Node.js version required (default: "20.9.0")
- `required_python_version` (string): Minimum Python version required (default: "3.9")
- `auto_fix` (boolean): Automatically apply fixes without prompting (default: true)
- `prefer_windows_node` (boolean): Prefer Windows Node.js over WSL installation (default: true)
- `services` (array): List of services to start (e.g., ["backend", "frontend", "database"])

## Usage Examples

```bash
# Auto-detect project type and configure environment
Skill: wsl-environment-setup --project_type auto-detect

# Configure Node.js project with specific version requirement
Skill: wsl-environment-setup --project_type nodejs --required_node_version "18.0.0"

# Configure full-stack project and start all services
Skill: wsl-environment-setup --project_type fullstack --services ["backend", "frontend"]

# Check environment without auto-fixing issues
Skill: wsl-environment-setup --project_type nodejs --auto_fix false
```

## Execution Steps

### 1. Detect WSL Environment

```bash
# Check if running in WSL
if uname -r | grep -qi microsoft; then
    echo "✅ WSL environment detected"
    WSL_DETECTED=true
else
    echo "ℹ️  Not running in WSL, skipping WSL-specific configuration"
    exit 0
fi
```

**Output:**
- Environment type (WSL 1, WSL 2, or native Linux)
- WSL distribution name (Ubuntu, Debian, etc.)
- Windows drives accessible (`/mnt/c`, `/mnt/d`, etc.)

### 2. Detect Project Type (if auto-detect)

Scan project root for:
- `package.json` → Node.js project
- `requirements.txt` or `pyproject.toml` → Python project
- Both → Full-stack project
- `frontend/`, `backend/` directories → Monorepo structure

**Output:**
```
Project Analysis:
- Type: fullstack (monorepo)
- Backend: Python (FastAPI)
- Frontend: Node.js (Next.js)
- Services detected: 3
  - backend/ (Python 3.11 required)
  - frontend-web/ (Node.js 20.9.0 required)
  - frontend-chatbot/ (Node.js 20.9.0 required)
```

### 3. Check Node.js Version (if applicable)

```bash
# Check WSL Node.js version
wsl_node_version=$(node --version 2>/dev/null || echo "not_installed")
echo "WSL Node.js: $wsl_node_version"

# Check Windows Node.js version
windows_node_version=$(/mnt/c/Program\ Files/nodejs/node.exe --version 2>/dev/null || echo "not_installed")
echo "Windows Node.js: $windows_node_version"

# Compare with required version
required_version="${required_node_version}"
```

**Decision Tree:**
1. WSL Node.js >= required → ✅ Use WSL Node.js
2. WSL Node.js < required, Windows Node.js >= required → Use Windows Node.js (Solution 1)
3. Both < required → Install Node.js in WSL (Solution 2)
4. Neither installed → Install Node.js in WSL

### 4. Apply Node.js Fix (if needed)

#### **Solution 1: Use Windows Node.js from WSL (Fast)**

```bash
# Add Windows Node.js to PATH
export PATH="/mnt/c/Program Files/nodejs:$PATH"

# Verify
node --version
npm --version

# Persist to current shell session
echo 'export PATH="/mnt/c/Program Files/nodejs:$PATH"' >> ~/.bashrc
```

**Benefits:**
- ✅ No installation required (uses existing Windows Node.js)
- ✅ Fast (no downloads)
- ✅ Automatically stays updated with Windows Node.js

**Output:**
```
✅ Node.js Version Fix Applied
Method: Windows Node.js via PATH
Version: v24.12.0 (meets requirement >=20.9.0)
PATH updated: /mnt/c/Program Files/nodejs added
Persistence: Added to ~/.bashrc
```

#### **Solution 2: Install Node.js in WSL via NVM**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install required Node.js version
nvm install ${required_node_version%%.*}  # Extract major version (e.g., 20 from 20.9.0)
nvm use ${required_node_version%%.*}

# Set as default
nvm alias default ${required_node_version%%.*}

# Verify
node --version
```

**Output:**
```
✅ Node.js Installed in WSL
Method: NVM (Node Version Manager)
Version: v20.19.6 (meets requirement >=20.9.0)
Default version set: v20
NVM added to ~/.bashrc
```

### 5. Check Python Version (if applicable)

```bash
# Check WSL Python version
wsl_python_version=$(python3 --version 2>/dev/null || echo "not_installed")
echo "WSL Python: $wsl_python_version"

# Check Windows Python version (if accessible)
windows_python_version=$(/mnt/c/Python311/python.exe --version 2>/dev/null || echo "not_installed")
echo "Windows Python: $windows_python_version"
```

**Decision Tree:**
1. WSL Python >= required → ✅ Use WSL Python
2. WSL Python < required → Suggest upgrading WSL Python
3. Not installed → Provide installation instructions

### 6. Configure Environment Variables

Check for common environment variable files:
- `.env`
- `.env.local`
- `.env.development`

**WSL-Specific Adjustments:**
```bash
# Convert Windows paths to WSL paths in .env files
# C:\Users\... → /mnt/c/Users/...
# D:\Projects\... → /mnt/d/Projects/...

# Example transformations:
DATABASE_PATH=C:\data\app.db → DATABASE_PATH=/mnt/c/data/app.db
LOG_FILE=D:\logs\app.log → LOG_FILE=/mnt/d/logs/app.log
```

**Output:**
```
Environment Variables Checked:
- .env: Found ✅ (3 variables)
- .env.local: Found ✅ (5 variables)
- Path conversions: 2 Windows paths detected and converted
```

### 7. Start Services (if requested)

For each service in `services` parameter:

**Backend (Python/FastAPI):**
```bash
cd backend
# Check for virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate || ./venv/Scripts/activate
fi
# Start server
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000 &
```

**Frontend (Node.js):**
```bash
cd frontend
# Use configured Node.js (Windows or WSL)
npm run dev &
```

**Output for each service:**
```
Service: backend
Status: ✅ Started
Port: 8000
PID: 12345
URL: http://localhost:8000
Logs: /tmp/claude/<workspace>/tasks/<task-id>.output
```

### 8. Generate Summary Report

```
==================== WSL ENVIRONMENT SETUP REPORT ====================
Environment: WSL 2 (Ubuntu 22.04)
Project Type: fullstack (monorepo)

Node.js Configuration:
  WSL Version: v18.19.1 (below required >=20.9.0)
  Windows Version: v24.12.0 ✅
  Solution Applied: Windows Node.js via PATH
  Status: ✅ Ready

Python Configuration:
  WSL Version: v3.11.6 ✅
  Status: ✅ Meets requirement (>=3.9)

Environment Variables:
  Files Found: .env, .env.local
  Path Conversions: 2 applied
  Status: ✅ Configured

Services Started: 3/3
  ✅ backend (port 8000) - http://localhost:8000
  ✅ frontend-web (port 3000) - http://localhost:3000
  ✅ frontend-chatbot (port 3001) - http://localhost:3001

Next Steps:
  1. Open browser to http://localhost:3000
  2. Check backend health: http://localhost:8000/health
  3. Monitor logs with: tail -f /tmp/claude/*/tasks/*.output

Notes:
  - Windows Node.js accessible via: /mnt/c/Program Files/nodejs
  - To persist PATH changes, restart terminal or run: source ~/.bashrc
  - WSL netstat may not show Windows-bound ports (this is normal)
=====================================================================
```

## Validation Checks

After setup, verify:

1. **Node.js Version**
   ```bash
   node --version  # Should be >= required_node_version
   npm --version   # Should be available
   ```

2. **Python Version**
   ```bash
   python3 --version  # Should be >= required_python_version
   pip --version      # Should be available
   ```

3. **Port Availability**
   ```bash
   # Check if services are listening
   netstat -tuln | grep -E ':(3000|3001|8000)'
   # Or check processes
   ps aux | grep -E '(node|python|uvicorn)'
   ```

4. **Service Health**
   ```bash
   # Backend health check
   curl -s http://localhost:8000/health

   # Frontend accessibility
   curl -s http://localhost:3000 | head -20
   ```

## Acceptance Criteria

- ✅ Correctly detects WSL environment (WSL 1, WSL 2, or not WSL)
- ✅ Auto-detects project type from file structure
- ✅ Identifies Node.js version mismatches between WSL and Windows
- ✅ Applies appropriate fix (Windows Node.js PATH or NVM installation)
- ✅ Validates Python version requirements
- ✅ Converts Windows paths to WSL paths in environment files
- ✅ Starts all requested services in background
- ✅ Provides comprehensive summary report with service URLs
- ✅ Includes troubleshooting notes for common WSL issues
- ✅ Returns appropriate exit codes (0: success, 1: error, 2: partial success)

## Common Issues Handled

### Issue 1: Node.js Version Mismatch
**Symptom:** `You are using Node.js X.X.X. For Next.js, Node.js version ">=Y.Y.Y" is required.`

**Fix Applied:**
- Check if Windows has suitable Node.js version
- Add Windows Node.js to PATH if available
- Otherwise, install via NVM in WSL

### Issue 2: PATH Not Persisting
**Symptom:** Node.js works in current session but not after restart

**Fix Applied:**
```bash
# Automatically add to ~/.bashrc
echo 'export PATH="/mnt/c/Program Files/nodejs:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Issue 3: WSL Netstat Doesn't Show Ports
**Symptom:** `netstat` shows no ports but services claim to be running

**Fix Applied:**
- Document that this is expected behavior (Windows-bound ports)
- Use process checks instead: `ps aux | grep node`
- Verify via `curl` to service URLs

### Issue 4: Module Not Found (npm/npx)
**Symptom:** `npm: command not found` after adding Windows Node.js to PATH

**Fix Applied:**
```bash
# Ensure both node.exe and npm are accessible
export PATH="/mnt/c/Program Files/nodejs:$PATH"
# Verify with: which node npm npx
```

### Issue 5: Slow NVM Installation
**Symptom:** NVM download hangs or times out

**Fix Applied:**
- Set timeout: `timeout 300s curl -o- https://...`
- If timeout, fall back to system package manager:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

## Dependencies

**WSL System:**
- WSL 1 or WSL 2 installed
- Windows file system accessible (`/mnt/c`, `/mnt/d`)
- `curl` for downloading installers

**Node.js Projects:**
- `package.json` present
- `npm` or `yarn` as package manager

**Python Projects:**
- `requirements.txt` or `pyproject.toml` present
- `pip` for package management

## Error Handling

| Error | Message | Exit Code |
|-------|---------|-----------|
| Not in WSL | "ℹ️ Not running in WSL, skipping WSL-specific configuration" | 0 |
| No Windows Node.js found | "⚠️ Windows Node.js not found at `/mnt/c/Program Files/nodejs/`. Installing via NVM..." | 0 (continues) |
| NVM installation failed | "❌ Failed to install NVM. Manual installation required." | 1 |
| Service start failed | "❌ Failed to start service '<name>': <error>" | 2 |
| Port already in use | "⚠️ Port <port> already in use. Kill process? (y/n)" | 2 |
| Invalid project type | "❌ Invalid project_type. Must be: nodejs, python, fullstack, auto-detect" | 1 |

## Integration with Other Skills

This skill can be used alongside:
- **test-runner**: After environment setup, run tests to verify configuration
- **code-analyzer**: Analyze project structure to improve auto-detection
- **cli-builder**: Generate startup scripts that automatically call this skill

## Example Workflow

**Scenario**: User switches from Windows Terminal to WSL and says "run the project"

```bash
# Step 1: Detect environment and configure
Skill: wsl-environment-setup --project_type auto-detect --services ["backend", "frontend-web", "frontend-chatbot"]

# Skill automatically:
# 1. Detects WSL 2 environment
# 2. Finds Node.js 18.19.1 in WSL (too old)
# 3. Discovers Windows Node.js 24.12.0 at /mnt/c/Program Files/nodejs/
# 4. Adds Windows Node.js to PATH
# 5. Starts all 3 services in background
# 6. Reports URLs: localhost:8000, localhost:3000, localhost:3001

# Step 2: User can now access services
curl http://localhost:8000/health  # Backend healthy
open http://localhost:3000          # Frontend loads
open http://localhost:3001          # Chatbot loads
```

## Notes

- **Idempotent**: Can run multiple times safely (checks before applying fixes)
- **Non-Destructive**: Never uninstalls existing Node.js/Python installations
- **Reversible**: PATH changes can be removed from `~/.bashrc`
- **Performance**: Prefers fast solutions (Windows Node.js) over slow downloads
- **Logging**: All operations logged for debugging
- **Cross-Platform**: Detects and skips if not in WSL (safe for native Linux)

## Version History

- **v1.0.0** (2025-12-31): Initial version based on Todo App WSL troubleshooting
  - Node.js version detection and auto-fix
  - Windows Node.js PATH configuration
  - NVM installation fallback
  - Multi-service startup
  - Comprehensive reporting

## Future Enhancements

- [ ] Support for yarn and pnpm package managers
- [ ] Docker Desktop integration detection
- [ ] WSL 1 vs WSL 2 specific optimizations
- [ ] Automatic port conflict resolution
- [ ] Service health monitoring with auto-restart
- [ ] Integration with systemd for service management
- [ ] Support for PostgreSQL/MySQL WSL configuration
- [ ] Network performance tuning for WSL 2

## References

- [WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/)
- [NVM GitHub](https://github.com/nvm-sh/nvm)
- [Node.js Version Requirements](https://nodejs.org/en/about/previous-releases)
- PHR: `history/prompts/general/007-wsl-nodejs-upgrade-project-startup.general.prompt.md`
