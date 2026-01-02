# 90-Second Demo Video Script
**Hackathon II - The Evolution of TODO**

**Project**: Spec-Driven Development with Claude Code
**Target Time**: 85 seconds (5-second buffer)
**Format**: Screen recording with voiceover

---

## 🎬 **Video Structure**

| Segment | Time | What to Show | What to Say |
|---------|------|--------------|-------------|
| **Intro** | 0:00-0:10 (10s) | GitHub repo overview | Opening statement |
| **Phase II** | 0:10-0:35 (25s) | Web UI features | Task management demo |
| **Phase III** | 0:35-0:60 (25s) | AI Chatbot | Natural language demo |
| **Spec-Driven** | 0:60-0:80 (20s) | Documentation | Specs, PHRs, constitution |
| **Closing** | 0:80-0:85 (5s) | GitHub + scores | Call to action |

---

## 📝 **Complete Script with Timing**

### **[0:00-0:10] Opening - GitHub Repository** (10 seconds)

**Screen**: GitHub repo main page (https://github.com/Malikasadjaved/The-Evolution-Of-TODO)

**Action**: Scroll slowly to show:
- Project name
- Folder structure (backend, frontend-web, frontend-chatbot, specs)
- README preview

**Voiceover**:
> "The Evolution of TODO - a hackathon project showcasing Spec-Driven Development with Claude Code. Three phases complete: console app, full-stack web, and AI chatbot."

**Timing**: 10 seconds

---

### **[0:10-0:35] Phase II - Full-Stack Web Application** (25 seconds)

#### **[0:10-0:15] Landing Page** (5 seconds)

**Screen**: Open `http://localhost:3000`

**Action**: Show landing page briefly

**Voiceover**:
> "Phase Two: a modern full-stack web app with Next.js 16, React 19, and FastAPI backend."

**Timing**: 5 seconds

---

#### **[0:15-0:20] Authentication** (5 seconds)

**Screen**: Click "Sign In" → Show login page → Enter credentials → Click sign in

**Action**: Quick login demonstration (use pre-filled form)

**Voiceover**:
> "User authentication with Better Auth and JWT tokens ensures secure, isolated data."

**Timing**: 5 seconds

---

#### **[0:20-0:35] Dashboard Features** (15 seconds)

**Screen**: Dashboard with tasks visible

**Actions** (rapid fire):
1. Show existing tasks (2 seconds)
2. Click "Add Task" → Create new task "Demo Task" (3 seconds)
3. Click task checkbox to mark complete (2 seconds)
4. Show glassmorphism calendar widget (2 seconds)
5. Hover over task to show edit/delete options (2 seconds)
6. Show search bar and filters (2 seconds)
7. Scroll to show stats (completed count) (2 seconds)

**Voiceover**:
> "Full CRUD operations: create, edit, delete, and complete tasks. Priority levels, tags, search, filters, and a beautiful glassmorphism design with Framer Motion animations."

**Timing**: 15 seconds

---

### **[0:35-0:60] Phase III - AI Chatbot with MCP** (25 seconds)

#### **[0:35-0:40] Chatbot Interface** (5 seconds)

**Screen**: Navigate to `http://localhost:3001` (chatbot interface)

**Action**: Show clean chat interface

**Voiceover**:
> "Phase Three: an AI-powered chatbot using OpenAI Agents SDK and MCP architecture."

**Timing**: 5 seconds

---

#### **[0:40-0:55] Natural Language Demo** (15 seconds)

**Screen**: Chatbot conversation

**Actions**:
1. Type: "Add a task to buy groceries tomorrow" → Send (3 seconds)
2. Show AI response confirming task creation (2 seconds)
3. Type: "Show my pending tasks" → Send (2 seconds)
4. Show AI listing tasks (2 seconds)
5. Type: "Mark the first one as done" → Send (2 seconds)
6. Show AI confirmation (2 seconds)
7. Quick switch to web UI to show task appeared there too (2 seconds)

**Voiceover**:
> "Manage tasks using natural language. The chatbot understands context, uses five MCP tools for task operations, and syncs instantly with the web UI through a shared database."

**Timing**: 15 seconds

---

#### **[0:55-0:60] Stateless Architecture** (5 seconds)

**Screen**: Quick flash of code - `backend/mcp/tools/` directory

**Action**: Show folder with 5 MCP tools

**Voiceover**:
> "Stateless MCP server with conversation persistence enables horizontal scaling."

**Timing**: 5 seconds

---

### **[0:60-0:80] Spec-Driven Development** (20 seconds)

#### **[0:60-0:70] Specifications** (10 seconds)

**Screen**: GitHub repo - `specs/` folder

**Actions**:
1. Show `specs/001-fullstack-web-app/spec.md` (2 seconds)
2. Scroll to show user stories (2 seconds)
3. Show `specs/001-fullstack-web-app/tasks.md` - 184 tasks (2 seconds)
4. Show `specs/002-ai-chatbot-mcp/spec.md` (2 seconds)
5. Show `specs/002-ai-chatbot-mcp/tasks.md` - 124 tasks (2 seconds)

**Voiceover**:
> "Every feature was spec-driven: detailed user stories, architecture plans, and task breakdowns. Three hundred eight tasks across two phases."

**Timing**: 10 seconds

---

#### **[0:70-0:80] Prompt History Records** (10 seconds)

**Screen**: GitHub repo - `history/prompts/` folder

**Actions**:
1. Show folder structure (2 seconds)
2. Open `history/prompts/001-fullstack-web-app/` (2 seconds)
3. Show 8 PHR files (2 seconds)
4. Open one PHR to show format (2 seconds)
5. Show `.specify/memory/` constitutions (2 seconds)

**Voiceover**:
> "Seventeen Prompt History Records document every Claude Code interaction. Three constitutions define project principles. Complete spec-driven compliance."

**Timing**: 10 seconds

---

### **[0:80-0:85] Closing - GitHub & Scores** (5 seconds)

**Screen**: Split screen or quick transition:
1. GitHub repo star/fork (1 second)
2. Flash the HACKATHON_COMPLIANCE_REPORT.md showing "450/1000 points" (2 seconds)
3. Show test coverage badge or test results (1 second)
4. End on project logo or GitHub link (1 second)

**Voiceover**:
> "Four hundred fifty points: three phases complete. View the full project on GitHub."

**Timing**: 5 seconds

---

## 🎥 **Recording Setup Instructions**

### **Before Recording**:

1. **Close Unnecessary Apps**: Close all other apps to avoid notifications
2. **Clear Browser**: Clear browser history, close extra tabs
3. **Prepare Test Data**:
   ```bash
   # Make sure you have 3-5 sample tasks created
   # Test account credentials ready (auto-fill enabled)
   ```
4. **Test Run**: Do a practice run to ensure smooth workflow
5. **Audio**: Test microphone, minimize background noise

### **Screen Resolution**:
- **Recommended**: 1920x1080 (Full HD)
- **Minimum**: 1280x720 (HD)
- **Browser zoom**: 100% (no zoom)

### **Recording Tools**:

| Tool | Platform | Free | Link |
|------|----------|------|------|
| **OBS Studio** | Windows/Mac/Linux | ✅ Yes | https://obsproject.com/ |
| **Screen Recording (Windows 11)** | Windows | ✅ Yes | Win+G → Capture |
| **QuickTime** | Mac | ✅ Yes | Built-in |
| **Loom** | Browser | ✅ Yes (limited) | https://loom.com/ |

### **Recommended: OBS Studio**

**Settings for 90-second demo**:
```
Video:
- Resolution: 1920x1080
- FPS: 30
- Bitrate: 2500 kbps

Audio:
- Sample Rate: 48kHz
- Bitrate: 160 kbps
- Microphone: Enable noise suppression

Output:
- Format: MP4
- Encoder: x264
```

---

## 📋 **Step-by-Step Recording Process**

### **Preparation (5 minutes)**:

1. **Start Backend**:
   ```bash
   cd backend
   ./venv/Scripts/python.exe -m uvicorn src.api.main:app --reload --port 8000
   ```

2. **Start Frontend Web**:
   ```bash
   cd frontend-web
   npm run dev
   # Opens on http://localhost:3000
   ```

3. **Start Frontend Chatbot**:
   ```bash
   cd frontend-chatbot
   npm run dev
   # Opens on http://localhost:3001
   ```

4. **Open Browser Tabs** (in order):
   - Tab 1: GitHub repo
   - Tab 2: http://localhost:3000 (web UI)
   - Tab 3: http://localhost:3001 (chatbot)
   - Tab 4: GitHub specs folder
   - Tab 5: GitHub history/prompts folder

5. **Login to Web UI**: Pre-login to save time during recording

6. **Test Audio**: Record 5 seconds → playback → verify quality

---

### **Recording (3 takes recommended)**:

**Take 1**: Focus on smooth navigation
**Take 2**: Focus on clear voiceover
**Take 3**: Combine best of both

**Recording Checklist**:
- [ ] Audio levels good (speak clearly, not too fast)
- [ ] No background noise
- [ ] Cursor movements smooth (not jerky)
- [ ] All UI elements visible (not cut off)
- [ ] Timing under 90 seconds (ideally 85 seconds)
- [ ] All key features shown
- [ ] GitHub link visible at end

---

### **Post-Recording (5 minutes)**:

1. **Trim**: Cut dead time at start/end
2. **Add Intro Slide** (optional, 2 seconds):
   ```
   The Evolution of TODO
   Hackathon II - Spec-Driven Development
   By [Your Name]
   ```
3. **Add Outro Slide** (optional, 2 seconds):
   ```
   GitHub: github.com/Malikasadjaved/The-Evolution-Of-TODO
   450/1000 Points (3 Phases Complete)
   ```
4. **Export**:
   - Format: MP4 (H.264)
   - Resolution: 1920x1080 or 1280x720
   - Max file size: Check hackathon requirements

---

## 🎯 **Alternative: Condensed 85-Second Script**

If you're tight on time, use this condensed version:

### **[0:00-0:08] Intro** (8s)
"The Evolution of TODO: three phases of spec-driven development with Claude Code."
*(Show GitHub repo main page)*

### **[0:08-0:30] Phase II Web App** (22s)
"Phase Two: Next.js full-stack app with authentication, CRUD operations, priorities, tags, search, and glassmorphism design."
*(Rapid demo: login → dashboard → create task → complete task → show calendar)*

### **[0:30-0:52] Phase III Chatbot** (22s)
"Phase Three: AI chatbot with MCP architecture. Natural language task management syncs instantly with the web UI."
*(Demo: "Add task" → "Show tasks" → "Mark done" → switch to web UI)*

### **[0:52-0:70] Spec-Driven** (18s)
"Every feature was spec-driven: three hundred eight tasks, seventeen prompt history records, three constitutions. Complete Claude Code compliance."
*(Flash through specs, PHRs, constitutions on GitHub)*

### **[0:70-0:85] Closing** (15s)
"Four hundred fifty points earned. One hundred percent test coverage on critical paths. View the full project on GitHub."
*(Show compliance report, GitHub link)*

**Total**: 85 seconds

---

## 🎬 **Voiceover Script (Print This)**

### **Recording Tips**:
- Speak at **moderate pace** (not too fast)
- **Emphasize** key numbers: "three phases", "three hundred eight tasks", "four hundred fifty points"
- **Pause briefly** between sections (0.5 seconds)
- **Clear enunciation** on technical terms: "MCP", "JWT", "Claude Code"

### **Full Voiceover (Copy This)**:

```
[0:00-0:10]
The Evolution of TODO - a hackathon project showcasing Spec-Driven Development
with Claude Code. Three phases complete: console app, full-stack web, and AI chatbot.

[0:10-0:15]
Phase Two: a modern full-stack web app with Next.js 16, React 19, and FastAPI backend.

[0:15-0:20]
User authentication with Better Auth and JWT tokens ensures secure, isolated data.

[0:20-0:35]
Full CRUD operations: create, edit, delete, and complete tasks. Priority levels, tags,
search, filters, and a beautiful glassmorphism design with Framer Motion animations.

[0:35-0:40]
Phase Three: an AI-powered chatbot using OpenAI Agents SDK and MCP architecture.

[0:40-0:55]
Manage tasks using natural language. The chatbot understands context, uses five MCP
tools for task operations, and syncs instantly with the web UI through a shared database.

[0:55-0:60]
Stateless MCP server with conversation persistence enables horizontal scaling.

[0:60-0:70]
Every feature was spec-driven: detailed user stories, architecture plans, and task
breakdowns. Three hundred eight tasks across two phases.

[0:70-0:80]
Seventeen Prompt History Records document every Claude Code interaction. Three
constitutions define project principles. Complete spec-driven compliance.

[0:80-0:85]
Four hundred fifty points: three phases complete. View the full project on GitHub.
```

**Word Count**: 186 words
**Speaking Pace**: ~130 words/minute (comfortable pace)
**Duration**: ~86 seconds

---

## 🎥 **Quick Recording Checklist**

**Before Recording**:
- [ ] All 3 services running (backend, frontend-web, frontend-chatbot)
- [ ] Browser tabs open (GitHub, localhost:3000, localhost:3001)
- [ ] Test data prepared (3-5 sample tasks)
- [ ] Audio tested (microphone working, no background noise)
- [ ] Screen resolution set (1920x1080 or 1280x720)
- [ ] Notifications disabled
- [ ] Script printed or on second monitor

**During Recording**:
- [ ] Speak clearly at moderate pace
- [ ] Smooth cursor movements
- [ ] Hit all key features in order
- [ ] Stay under 90 seconds
- [ ] End on GitHub link

**After Recording**:
- [ ] Trim start/end
- [ ] Verify timing (under 90s)
- [ ] Check audio quality
- [ ] Verify all features visible
- [ ] Export as MP4

---

## 📤 **Submission Format**

**Upload to**:
- YouTube (unlisted) → Recommended
- Google Drive → Set to "Anyone with link can view"
- Loom → Direct link

**File Details**:
- **Format**: MP4
- **Duration**: Under 90 seconds
- **Resolution**: 1920x1080 or 1280x720
- **Quality**: HD minimum

---

## 🎬 **Ready to Record?**

### **Option 1: Do It Now** ✅ **Recommended**
1. Copy the voiceover script
2. Open OBS Studio or screen recorder
3. Follow the timeline above
4. Record 2-3 takes
5. Pick the best one
6. Upload to YouTube/Drive

### **Option 2: NotebookLM Audio** 🤖 **Alternative**
Use NotebookLM to generate an AI voiceover:
1. Copy specs and documentation into NotebookLM
2. Generate audio overview
3. Use that as voiceover while recording screen

### **Option 3: Text-Only Slides** 📝 **Backup**
If uncomfortable with voiceover:
1. Record screen only (no audio)
2. Add text overlays in video editor
3. Use the script text as captions

---

## 💡 **Pro Tips for a Great Demo**

1. **Show, Don't Tell**: Focus on visual demonstrations
2. **Smooth Transitions**: Practice switching between tabs
3. **Highlight Key Features**: Use cursor to point at important elements
4. **Keep Moving**: Don't linger too long on any screen
5. **End Strong**: Make sure GitHub link is clearly visible

---

**Need Help?**
- Practice run first? (I can guide you step-by-step)
- Want a different script style? (Faster/slower pace)
- Technical issues? (Audio, screen recording setup)

**Let me know and I'll help you record the perfect demo!** 🎬
