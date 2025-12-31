# PROMPT 10: Responsive Design & Accessibility Implementation Guide

## Summary of Changes Completed

### ✅ New Files Created

1. **`hooks/useMediaQuery.ts`** - Responsive breakpoint detection
   - `useIsMobile()` - < 640px
   - `useIsTablet()` - 640px - 1023px
   - `useIsDesktop()` - >= 1024px
   - `useIsMobileOrTablet()` - < 1024px
   - `usePrefersReducedMotion()` - Accessibility
   - `usePrefersHighContrast()` - Accessibility
   - `useBreakpoint()` - Returns current breakpoint name

2. **`hooks/useSwipeGesture.ts`** - Touch swipe detection
   - `useSwipeGesture()` - Full swipe detection (all directions)
   - `useHorizontalSwipe()` - Left/right swipes only
   - `useVerticalSwipe()` - Up/down swipes only
   - Configurable threshold (default: 50px)
   - Velocity-based detection

3. **`components/MobileDrawer.tsx`** - Slide-out sidebar for mobile
   - Slides in from right
   - Semi-transparent backdrop
   - Click outside to close
   - ESC key to close
   - Focus trap
   - ARIA attributes
   - Touch-friendly close button (44x44px)

### ✅ Files Updated

1. **`components/StatsGrid.tsx`** - Now fully responsive
   - Mobile: 2x2 grid (`grid-cols-2`)
   - Tablet: 2x2 grid (`md:grid-cols-2`)
   - Desktop: 4 columns (`lg:grid-cols-4`)
   - Reduced padding on mobile (`p-4 sm:p-6`)
   - Smaller text on mobile (`text-2xl sm:text-3xl`)
   - Min-height for consistent card sizes
   - ARIA attributes (`role="region"`, `aria-label`)

2. **`app/globals.css`** - Accessibility utilities
   - `.sr-only` - Screen reader only utility
   - `.sr-only-focusable` - Visible on focus (skip links)
   - `@media (prefers-contrast: more)` - High contrast mode
     - Increased border widths
     - Boosted text contrast
     - Removed subtle gradients
     - Stronger focus indicators
     - Disabled decorative animations

---

## Remaining Tasks for Dashboard (`app/dashboard/page.tsx`)

### 1. Add Imports

```typescript
import { MobileDrawer } from '@/components/MobileDrawer'
import { useIsMobileOrTablet } from '@/hooks/useMediaQuery'
```

### 2. Add State Variables

```typescript
// After existing state declarations (around line 64)
const isMobileOrTablet = useIsMobileOrTablet()
const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
```

### 3. Add Skip Link (Accessibility)

```typescript
// At the very beginning of the return statement (after opening <div>)
<a
  href="#main-content"
  className="sr-only-focusable fixed top-4 left-4 z-[200] bg-accent-primary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
>
  Skip to main content
</a>
```

### 4. Update Header for Proper Heading Hierarchy

```typescript
// Replace <h1> at line ~425 with proper semantic HTML
<h1 className="text-xl font-bold dark:text-white light:text-gray-900 transition-colors">
  Dashboard
</h1>
```

### 5. Update Kanban Board Layout for Responsive

```typescript
// Replace the grid at line ~612 from:
<div className="grid grid-cols-2 gap-6">

// To:
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
```

### 6. Update Column Headers to Use h2

```typescript
// Around line ~639, replace the column title:
<h2 className="text-2xl font-bold text-white">
  {column.title}
</h2>
```

### 7. Add Mobile Drawer Toggle Button

```typescript
// Replace the toggle right panel button (around line ~504) with:
{isMobileOrTablet ? (
  // Mobile: Opens drawer
  <motion.button
    onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-blue-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={isMobileDrawerOpen ? 'Hide sidebar' : 'Show sidebar'}
    aria-expanded={isMobileDrawerOpen}
  >
    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </motion.button>
) : (
  // Desktop: Toggles inline panel
  <motion.button
    onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-blue-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={isRightPanelOpen ? 'Hide sidebar' : 'Show sidebar'}
    aria-expanded={isRightPanelOpen}
  >
    <svg
      className={`w-5 h-5 text-cyan-400 transition-transform ${isRightPanelOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  </motion.button>
)}
```

### 8. Replace Right Sidebar with Conditional Rendering

```typescript
// Replace the current <AnimatePresence> sidebar (around line ~740) with:

{/* Desktop: Inline Sidebar */}
{!isMobileOrTablet && (
  <AnimatePresence>
    {isRightPanelOpen && (
      <motion.aside
        className="w-[380px] bg-white/5 backdrop-blur-xl border-l border-blue-500/20 overflow-y-auto"
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="complementary"
        aria-label="Calendar and upcoming deadlines"
      >
        {/* Calendar and Upcoming Deadlines content */}
      </motion.aside>
    )}
  </AnimatePresence>
)}

{/* Mobile: Drawer */}
<MobileDrawer
  isOpen={isMobileDrawerOpen}
  onClose={() => setIsMobileDrawerOpen(false)}
  title="Calendar & Deadlines"
  position="right"
>
  {/* Same calendar and deadlines content */}
</MobileDrawer>
```

### 9. Add ARIA Attributes to Main Content

```typescript
// Add to the <motion.main> tag (around line ~581):
<motion.main
  id="main-content"
  className="flex-1 overflow-y-auto p-4 sm:p-6"
  role="main"
  aria-label="Task board"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3 }}
>
```

### 10. Update Column Headers with ARIA

```typescript
// Around line ~622, add semantic HTML:
<section
  className="flex flex-col"
  aria-labelledby={`column-${column.status}`}
  role="region"
>
  <div className={`bg-gradient-to-br ${column.gradient} backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 sm:p-6 mb-5 shadow-lg`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center" aria-hidden="true">
          {/* Icon */}
        </div>
        <div>
          <h2 id={`column-${column.status}`} className="text-xl sm:text-2xl font-bold text-white">
            {column.title}
          </h2>
          <p className="text-sm text-gray-400" aria-live="polite">
            {column.tasks?.length || 0} tasks
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## TaskCard Component Updates (`components/TaskCard.tsx`)

### Add Swipe Gestures

```typescript
import { useHorizontalSwipe } from '@/hooks/useSwipeGesture'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useState } from 'react'

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onClick,
  onDelete,
  onToggleStatus,
}) => {
  const isMobile = useIsMobile()
  const [swipeAction, setSwipeAction] = useState<'none' | 'complete' | 'delete'>('none')

  const swipeHandlers = useHorizontalSwipe(
    () => {
      // Swipe left: Delete
      if (isMobile) {
        setSwipeAction('delete')
        setTimeout(() => onDelete?.(task), 300)
      }
    },
    () => {
      // Swipe right: Complete
      if (isMobile) {
        setSwipeAction('complete')
        setTimeout(() => onToggleStatus?.(task.id, task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'), 300)
      }
    },
    50 // threshold
  )

  return (
    <motion.article
      {...(isMobile ? swipeHandlers : {})}
      className={cn(
        "relative",
        swipeAction === 'complete' && "bg-green-500/20",
        swipeAction === 'delete' && "bg-red-500/20"
      )}
      role="article"
      aria-label={`Task: ${task.title}`}
      tabIndex={0}
      // ... rest of props
    >
      {/* Visual swipe indicator */}
      {isMobile && swipeAction !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          {swipeAction === 'complete' ? (
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      )}
      {/* Task content */}
    </motion.article>
  )
}
```

---

## Keyboard Shortcuts Enhancement (`hooks/useKeyboardShortcuts.ts`)

### Add Arrow Key Navigation

```typescript
// Add to handleKeyDown callback:

// Arrow keys for task navigation (when not in input)
if (!isInputField) {
  const focusedElement = document.activeElement as HTMLElement

  // Arrow Down: Next task
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const nextTask = focusedElement.nextElementSibling as HTMLElement
    if (nextTask && nextTask.hasAttribute('tabindex')) {
      nextTask.focus()
    }
  }

  // Arrow Up: Previous task
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const prevTask = focusedElement.previousElementSibling as HTMLElement
    if (prevTask && prevTask.hasAttribute('tabindex')) {
      prevTask.focus()
    }
  }

  // Enter: Open task details
  if (event.key === 'Enter') {
    event.preventDefault()
    if (focusedElement.hasAttribute('data-task-id')) {
      focusedElement.click()
    }
  }

  // Delete/Backspace: Delete task (with confirmation)
  if ((event.key === 'Delete' || event.key === 'Backspace') && onDeleteTask) {
    event.preventDefault()
    if (focusedElement.hasAttribute('data-task-id')) {
      const confirmed = window.confirm('Delete this task?')
      if (confirmed) {
        onDeleteTask()
      }
    }
  }
}

// Numeric keys 1/2/3 for priority filter
if (!isInputField && event.key >= '1' && event.key <= '3') {
  event.preventDefault()
  const priorities = ['LOW', 'MEDIUM', 'HIGH']
  onFilterPriority?.(priorities[parseInt(event.key) - 1])
}
```

---

## Touch Target Verification Checklist

### Components to Check (44x44px minimum):

- [x] **Button Component** - Already has min-h-[44px] in md+ sizes
- [ ] **QuickAddButton** - Verify min-h-[44px] min-w-[44px]
- [ ] **NotificationBell** - Check button size
- [ ] **UserMenu** trigger - Check button size
- [ ] **FABGroup** buttons - Already large (56px+)
- [ ] **TaskCard** checkbox - Make 44x44px on mobile
- [ ] **Calendar** day cells - Already 40px+ (acceptable for desktop, increase for mobile)
- [ ] **MobileDrawer** close button - Already 44x44px
- [ ] All icon-only buttons in header
- [ ] Filter dropdowns and selects

### Update Formula:
```css
className="min-h-[44px] min-w-[44px] p-2"  /* For mobile */
className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2"  /* Responsive */
```

---

## Color Contrast Validation (WCAG AA)

### Contrast Ratios to Test:

1. **Text on Dark Backgrounds**:
   - White text (#ffffff) on dark navy (#0f172a): ✅ 15:1 (Excellent)
   - Light slate (#94a3b8) on dark navy: ✅ 7:1 (Good)
   - Cyan (#06b6d4) on dark navy: ⚠️ Test with tool

2. **Interactive Elements**:
   - Focus rings: 2px solid purple-400: ✅ Sufficient
   - Button text on gradient backgrounds: ⚠️ Test each variant

3. **Priority Badges**:
   - Red on red background: ⚠️ May need adjustment
   - Yellow on yellow background: ⚠️ May need adjustment
   - Green on green background: ✅ Usually sufficient

### Testing Tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Accessibility Panel
- WAVE Extension

---

## Testing Checklist

### Mobile (< 640px):
- [ ] Stats grid shows 2x2 layout
- [ ] Tasks stack in single column
- [ ] Sidebar opens in drawer
- [ ] Swipe gestures work (right=complete, left=delete)
- [ ] All touch targets 44x44px
- [ ] Search bar shows icon, expands on tap
- [ ] FAB group positioned correctly

### Tablet (640px - 1023px):
- [ ] Stats grid shows 2x2 layout
- [ ] Tasks show 2 columns
- [ ] Sidebar opens in drawer or bottom
- [ ] Touch targets adequate
- [ ] Navigation responsive

### Desktop (>= 1024px):
- [ ] Stats grid shows 4 columns
- [ ] Tasks show 2 columns
- [ ] Sidebar inline (right panel)
- [ ] Keyboard navigation works
- [ ] All shortcuts functional

### Accessibility:
- [ ] Screen reader announces all content
- [ ] Skip link works (Tab → Enter)
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] Focus visible on all elements
- [ ] ARIA attributes present
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] High contrast mode renders correctly
- [ ] Reduced motion respected

### Cross-Browser:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Implementation Priority

1. **High Priority** (Core Functionality):
   - ✅ Responsive StatsGrid
   - ✅ MobileDrawer component
   - ✅ Media query hooks
   - ⏳ Dashboard responsive layout
   - ⏳ Heading hierarchy
   - ⏳ ARIA attributes

2. **Medium Priority** (Enhanced UX):
   - ⏳ Swipe gestures on TaskCard
   - ⏳ Enhanced keyboard shortcuts
   - ⏳ Touch target verification

3. **Low Priority** (Polish):
   - ⏳ Color contrast validation
   - ⏳ Cross-browser testing
   - ⏳ Screen reader testing

---

## Files Modified Summary

### Created:
- `hooks/useMediaQuery.ts`
- `hooks/useSwipeGesture.ts`
- `components/MobileDrawer.tsx`
- `RESPONSIVE_IMPLEMENTATION_GUIDE.md`

### Updated:
- `components/StatsGrid.tsx`
- `app/globals.css`

### To Update:
- `app/dashboard/page.tsx`
- `components/TaskCard.tsx`
- `hooks/useKeyboardShortcuts.ts`
- `components/QuickAddButton.tsx` (verify touch targets)
- `components/NotificationBell.tsx` (verify touch targets)
- `components/Calendar.tsx` (verify touch targets on mobile)

---

## Next Steps

1. **Update dashboard.tsx** with changes from sections 1-10 above
2. **Add swipe gestures to TaskCard** (section: TaskCard Component Updates)
3. **Enhance keyboard shortcuts** (section: Keyboard Shortcuts Enhancement)
4. **Verify touch targets** across all components
5. **Test on real devices** (mobile, tablet, desktop)
6. **Run accessibility audit** (Lighthouse, WAVE)
7. **Fix any color contrast issues** found during testing

---

**All core utilities and components are ready. The dashboard just needs the integration code applied!**
