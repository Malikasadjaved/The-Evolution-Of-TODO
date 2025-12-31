---
id: 009
title: Professional light-dark theme system
stage: green
date: 2025-12-31
surface: agent
model: claude-opus-4-5-20251101
feature: 001-fullstack-web-app
branch: ui-ux-modern-redesign
user: Malikasadjaved
command: /sp.phr
labels: ["ui-ux", "theme-system", "light-mode", "dark-mode", "accessibility", "contrast", "shadows", "professional-design"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend-web/app/pro-dashboard/page.tsx
tests:
  - none
---

## Prompt

Update the theme system in app/pro-dashboard/page.tsx to implement professional UI/UX design with proper light and dark modes.

CRITICAL ISSUES TO FIX:

1. Light mode has poor contrast (white text on light backgrounds)
2. Cards don't have proper shadows in light mode
3. Text colors don't change appropriately between themes
4. Borders are too faint in light mode
5. Overall lack of visual hierarchy

TASK 1: Replace the getThemeClasses() function (around line 250) with this professional version:

```typescript
const getThemeClasses = () => {
  if (isDarkMode) {
    // DARK MODE - Premium Dark Theme
    return {
      // Main Layout
      mainBg: 'bg-slate-950',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-slate-900/95',

      // Cards & Surfaces
      cardBg: 'bg-slate-900',
      cardHover: 'hover:bg-slate-800/80',
      cardBorder: 'border-slate-800/50',
      cardShadow: 'shadow-lg shadow-black/20',

      // Stats Cards
      statCardBg: 'bg-gradient-to-br from-slate-800/60 to-slate-900/60',
      statCardBorder: 'border-slate-700/40',
      statCardHover: 'hover:border-purple-500/30 hover:shadow-purple-500/10',

      // Task Cards
      taskCard: 'bg-slate-800/40 backdrop-blur-sm',
      taskCardHover: 'hover:bg-slate-800/60 hover:border-purple-500/40',
      taskCardBorder: 'border-slate-700/50',

      // Inputs
      inputBg: 'bg-slate-800/50',
      inputBorder: 'border-slate-700/50',
      inputFocus: 'focus:border-purple-500/50 focus:bg-slate-800/70',
      inputText: 'text-slate-100 placeholder:text-slate-500',

      // Text Colors
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      textMuted: 'text-slate-600',

      // Borders
      border: 'border-slate-800/50',
      borderStrong: 'border-slate-700',
      divider: 'border-slate-800',

      // Interactive Elements
      buttonSecondary: 'bg-slate-800 hover:bg-slate-700',
      dropdownBg: 'bg-slate-800',
      dropdownHover: 'hover:bg-slate-700/70',

      // Modal
      modalBackdrop: 'bg-black/60',
      modalBg: 'bg-slate-900',
      modalBorder: 'border-slate-700',

      // Shadows
      shadow: 'shadow-xl shadow-black/30',
      shadowLg: 'shadow-2xl shadow-black/40',
    }
  } else {
    // LIGHT MODE - Premium Light Theme
    return {
      // Main Layout
      mainBg: 'bg-slate-50',
      sidebarBg: 'bg-white',
      headerBg: 'bg-white/95',

      // Cards & Surfaces
      cardBg: 'bg-white',
      cardHover: 'hover:bg-slate-50',
      cardBorder: 'border-slate-200',
      cardShadow: 'shadow-sm',

      // Stats Cards
      statCardBg: 'bg-gradient-to-br from-white to-slate-50/50',
      statCardBorder: 'border-slate-200',
      statCardHover: 'hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5',

      // Task Cards
      taskCard: 'bg-white',
      taskCardHover: 'hover:bg-slate-50/80 hover:border-purple-400/50',
      taskCardBorder: 'border-slate-200',

      // Inputs
      inputBg: 'bg-white',
      inputBorder: 'border-slate-300',
      inputFocus: 'focus:border-purple-500 focus:bg-white',
      inputText: 'text-slate-900 placeholder:text-slate-400',

      // Text Colors
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-400',

      // Borders
      border: 'border-slate-200',
      borderStrong: 'border-slate-300',
      divider: 'border-slate-200',

      // Interactive Elements
      buttonSecondary: 'bg-slate-100 hover:bg-slate-200',
      dropdownBg: 'bg-white',
      dropdownHover: 'hover:bg-slate-50',

      // Modal
      modalBackdrop: 'bg-slate-900/30',
      modalBg: 'bg-white',
      modalBorder: 'border-slate-200',

      // Shadows
      shadow: 'shadow-lg shadow-slate-200/60',
      shadowLg: 'shadow-xl shadow-slate-300/40',
    }
  }
}
```

TASK 2: Update ALL component classNames to use the new theme system. Key changes:

1. Sidebar: Add shadow and proper borders
2. All text elements: Use textPrimary/textSecondary/textMuted
3. All cards: Add cardShadow for elevation
4. All inputs: Use inputText for proper text colors
5. All borders: Use appropriate border classes
6. Stat cards: Use statCardBg, statCardBorder, statCardHover
7. Task cards: Use taskCard, taskCardBorder, taskCardHover
8. Modals: Use modalBg, modalBorder, modalBackdrop
9. Buttons: Use buttonSecondary where appropriate
10. Dropdowns: Use dropdownBg, dropdownHover

CRITICAL: In light mode, text must be dark (text-slate-900) and cards must have shadows. In dark mode, text must be light (text-slate-100) with minimal shadows.

Replace every hardcoded color class with the appropriate themeClasses property. The goal is professional, accessible design with proper contrast in both modes.

## Response snapshot

Successfully implemented a professional theme system for the pro-dashboard with comprehensive updates to all components. Replaced the `getThemeClasses()` function with a premium dark/light theme system featuring proper contrast, shadows, and visual hierarchy. Updated 8 major component areas: sidebar, header, stats cards, task list/grid, modals (add/edit), task drawer, and quick actions. All text elements now use semantic color tokens (textPrimary/textSecondary/textMuted), cards have proper elevation with appropriate shadows, and inputs have consistent styling across themes. Light mode now features dark text on light backgrounds with visible shadows, while dark mode maintains light text with subtle shadows for depth.

## Outcome

- ✅ Impact: Implemented professional UI/UX theme system with proper light/dark mode support, fixing critical contrast issues and establishing visual hierarchy across the entire pro-dashboard
- 🧪 Tests: Manual verification of theme switching and visual contrast required
- 📁 Files: Modified `frontend-web/app/pro-dashboard/page.tsx` (1247 lines, updated theme system and 8 component sections)
- 🔁 Next prompts: Test theme switching in browser, verify WCAG AA contrast ratios, implement similar theme system in other dashboard pages
- 🧠 Reflection: A well-structured theme token system eliminates hardcoded colors and ensures consistent, accessible design across both light and dark modes - the key is semantic naming (textPrimary vs specific colors)

## Evaluation notes (flywheel)

- Failure modes observed: None - the implementation followed a systematic approach updating the theme function first, then methodically updating each component section. The task-based workflow with TodoWrite helped track progress across 9 distinct areas.
- Graders run and results (PASS/FAIL): Not applicable - this is a UI/UX implementation requiring manual visual testing
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Extract theme tokens into a separate TypeScript file for reusability across other pages (e.g., `lib/theme-tokens.ts`), or create a ThemeProvider context to avoid prop drilling
