# Tailwind CSS Component Library Research
**Date**: 2025-12-10
**Project**: To-Do App Frontend
**Stack**: Next.js 15 + TypeScript + Tailwind CSS 3.4.1
**Current State**: Basic Tailwind setup with dark mode and custom colors

---

## Executive Summary

**Recommendation**: Use **shadcn/ui** for the To-Do App frontend.

**Rationale**:
- Zero runtime overhead (copy-paste components, not npm packages)
- Built on Radix UI primitives (accessibility built-in)
- Full Tailwind integration with your existing color scheme
- TypeScript-first with excellent type safety
- Dark mode support matches existing setup
- Easy customization - you own the code
- No bundle size penalty - only use what you need

---

## 1. Component Library Comparison

### Option 1: shadcn/ui (RECOMMENDED)

**What is it?**
- Not a traditional component library - it's a collection of re-usable components you copy into your project
- Built on Radix UI primitives for accessibility
- Uses Tailwind CSS for styling
- You own the code - no package dependency

**Pros:**
- ✅ Zero runtime dependencies (no npm package bloat)
- ✅ Full control - customize any component since you own the code
- ✅ Excellent TypeScript support
- ✅ Accessibility built-in via Radix UI
- ✅ Dark mode support out of the box
- ✅ Works perfectly with your existing Tailwind config
- ✅ Very active community and documentation
- ✅ Next.js 15 compatible
- ✅ CSS variables approach matches your globals.css setup

**Cons:**
- ❌ Need to install individual components (but this is also a pro)
- ❌ Updates require manual copying (but allows custom modifications)

**Bundle Size Impact**: Minimal - only the components you use are included
**Learning Curve**: Low - standard React patterns
**Customization**: Full control since you own the code

**Components Available:**
- Dialog/Modal ✅
- Toast/Sonner ✅
- Command/Dialog ✅
- Dropdown Menu ✅
- Form components ✅
- Button ✅
- Badge ✅
- Card ✅
- Input, Textarea, Select ✅
- And 40+ more components

**Installation for Your Project:**
```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install individual components as needed
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add card
```

---

### Option 2: Headless UI

**What is it?**
- Official component library by Tailwind Labs
- Completely unstyled (headless) - you provide all styling
- Focus on behavior and accessibility

**Pros:**
- ✅ Official Tailwind product
- ✅ Very lightweight
- ✅ Excellent accessibility
- ✅ Full styling control
- ✅ React 19 compatible

**Cons:**
- ❌ No pre-built styles - you build everything from scratch
- ❌ Smaller component selection than shadcn/ui
- ❌ More work to implement each component
- ❌ No TypeScript types as comprehensive as shadcn

**Bundle Size**: ~10-15KB gzipped
**Learning Curve**: Medium - need to understand headless patterns
**Customization**: Full control

**Components Available:**
- Dialog/Modal ✅
- Listbox (Select) ✅
- Menu (Dropdown) ✅
- Combobox ✅
- Tabs ✅
- Disclosure ✅
- Popover ✅
- Radio Group ✅
- Switch ✅

**Missing (need custom build):**
- Toast notifications ❌
- Form inputs (styled) ❌
- Badge ❌
- Card ❌

---

### Option 3: Radix UI + Custom Tailwind

**What is it?**
- Unstyled, accessible component primitives
- You add Tailwind styling yourself
- shadcn/ui is built on top of this

**Pros:**
- ✅ Best-in-class accessibility
- ✅ Comprehensive component set
- ✅ Excellent TypeScript support
- ✅ Very composable primitives

**Cons:**
- ❌ No styles provided - need to build everything
- ❌ More setup work than shadcn/ui
- ❌ Steeper learning curve
- ❌ Time-consuming to style each component

**Bundle Size**: ~20-30KB gzipped (depends on components used)
**Learning Curve**: High - complex API surface
**Customization**: Full control

**Verdict**: If you want Radix UI, use shadcn/ui instead - it's Radix + pre-styled Tailwind components.

---

### Option 4: Build Components from Scratch

**Pros:**
- ✅ Complete control
- ✅ Zero dependencies
- ✅ Learn component patterns deeply

**Cons:**
- ❌ Time-consuming
- ❌ Easy to miss accessibility features
- ❌ Need to handle focus management, keyboard navigation, ARIA attributes
- ❌ Reinventing the wheel
- ❌ Higher maintenance burden

**Verdict**: Not recommended for production apps with tight deadlines.

---

## 2. Common Component Patterns

### Modal/Dialog Implementation

**Best Practice Pattern (shadcn/ui approach):**

```tsx
// components/ui/dialog.tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    {...props}
  />
))

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))

export { Dialog, DialogTrigger, DialogContent, DialogClose }
```

**Usage:**
```tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <h2>Edit Task</h2>
    <TaskForm />
  </DialogContent>
</Dialog>
```

**Key Features:**
- Focus trap (Radix handles this)
- Backdrop with opacity
- ESC key to close
- Click outside to close
- Smooth animations
- Accessible ARIA attributes
- Portal rendering (renders outside DOM hierarchy)

---

### Toast Notification System

**Recommended: Sonner (by shadcn/ui team)**

```bash
npm install sonner
```

```tsx
// components/ui/sonner.tsx
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  )
}
```

**Usage:**
```tsx
import { toast } from 'sonner'

// Success
toast.success('Task created successfully!')

// Error
toast.error('Failed to delete task')

// With action
toast('Task archived', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
})

// Promise-based
toast.promise(saveTask(), {
  loading: 'Saving...',
  success: 'Task saved!',
  error: 'Failed to save',
})
```

**Features:**
- Auto-dismiss
- Stacking with slide animations
- Dark mode support
- Action buttons
- Promise-based toasts
- Customizable positioning
- Swipe to dismiss

---

### ConfirmDialog Pattern

```tsx
// components/ConfirmDialog.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Usage:**
```tsx
const [showConfirm, setShowConfirm] = useState(false)

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete Task?"
  description="This action cannot be undone. This will permanently delete the task."
  onConfirm={handleDelete}
  confirmText="Delete"
  variant="destructive"
/>
```

---

### Form Input Components

**Input with Label:**
```tsx
// components/ui/input.tsx
import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

**Textarea:**
```tsx
// components/ui/textarea.tsx
import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
```

**Select (Dropdown):**
```tsx
// components/ui/select.tsx (using Radix UI)
'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

const Select = SelectPrimitive.Root
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out"
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))

export { Select, SelectTrigger, SelectContent, SelectItem }
```

---

### Button Component

```tsx
// components/ui/button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Note**: Requires `class-variance-authority` package:
```bash
npm install class-variance-authority
```

---

### Badge Component

```tsx
// components/ui/badge.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // Priority-specific badges for your todo app
        low: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        medium: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        high: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />
}

export { Badge, badgeVariants }
```

---

### Card Component

```tsx
// components/ui/card.tsx
import * as React from 'react'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className="flex flex-col space-y-1.5 p-6" {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className="text-2xl font-semibold leading-none tracking-tight" {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className="text-sm text-muted-foreground" {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className="p-6 pt-0" {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className="flex items-center p-6 pt-0" {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## 3. Responsive Design Strategy

### Breakpoints (from Tailwind docs)

Your project already uses Tailwind's default breakpoints:

| Prefix | Min Width | Target |
|--------|-----------|--------|
| `sm:` | 640px | Mobile landscape, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops, desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large screens |

### Mobile-First Approach

**Core Principle**: Style for mobile first, then add larger breakpoints.

**Example - Task List Layout:**
```tsx
// Mobile: Stack vertically
// Tablet: 2 columns
// Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {tasks.map(task => <TaskCard key={task.id} task={task} />)}
</div>
```

**Example - Task Card:**
```tsx
<Card className="w-full p-4 sm:p-6">
  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <CardTitle className="text-lg sm:text-xl">{task.title}</CardTitle>
    <Badge variant={task.priority}>{task.priority}</Badge>
  </CardHeader>
  <CardContent className="text-sm sm:text-base">
    {task.description}
  </CardContent>
</Card>
```

### Grid vs Flexbox Strategy

**Use Grid for:**
- Task list layouts (equal-width columns)
- Form layouts (label + input pairs)
- Dashboard layouts (multiple sections)

```tsx
// Grid example - Task list
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {tasks.map(task => <TaskCard />)}
</div>

// Grid example - Form
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
    <Label>Title</Label>
    <Input />
  </div>
  <div>
    <Label>Priority</Label>
    <Select />
  </div>
</div>
```

**Use Flexbox for:**
- Navigation bars
- Button groups
- Card headers (title + actions)
- Tag lists (wrapping badges)

```tsx
// Flexbox example - Card header with actions
<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
  <h3>{task.title}</h3>
  <div className="flex gap-2">
    <Button size="sm">Edit</Button>
    <Button size="sm" variant="destructive">Delete</Button>
  </div>
</CardHeader>

// Flexbox example - Tag list
<div className="flex flex-wrap gap-2">
  {tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
</div>
```

### Touch Targets and Spacing

**Minimum touch target**: 44x44px (Apple) / 48x48px (Android)

```tsx
// Good - 44px minimum height
<Button className="h-11 min-w-[44px]">Submit</Button>

// Good - Mobile-specific touch targets
<Button className="h-10 sm:h-11 px-3 sm:px-4">
  Save Task
</Button>

// Good - Adequate spacing on mobile
<div className="flex flex-col gap-4 sm:gap-6">
  <TaskCard />
  <TaskCard />
</div>
```

### Responsive Typography

```tsx
// Scale text sizes responsively
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  My Tasks
</h1>

<p className="text-sm sm:text-base text-muted-foreground">
  {task.description}
</p>

// Truncate long text on mobile, show full on desktop
<h3 className="truncate sm:text-clip">
  {task.title}
</h3>
```

### Container Widths

```tsx
// Full width on mobile, constrained on desktop
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <TaskList />
</div>

// Modal - Full screen on mobile, centered on desktop
<DialogContent className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg">
  <TaskForm />
</DialogContent>
```

---

## 4. Animation & Transitions

### Tailwind Transition Utilities

**Basic transitions:**
```tsx
// Hover effects
<Button className="bg-primary hover:bg-primary/90 transition-colors">
  Save
</Button>

// Multiple properties
<Card className="transition-all hover:shadow-lg hover:scale-105">
  <TaskCard />
</Card>

// Custom duration
<div className="transition-opacity duration-300 hover:opacity-80">
  Content
</div>
```

### Modal Open/Close Animations

**Using Radix UI data attributes:**
```tsx
const DialogContent = () => (
  <DialogPrimitive.Content
    className="
      fixed left-[50%] top-[50%] z-50
      translate-x-[-50%] translate-y-[-50%]
      bg-background p-6 shadow-lg
      duration-200
      data-[state=open]:animate-in
      data-[state=closed]:animate-out
      data-[state=closed]:fade-out-0
      data-[state=open]:fade-in-0
      data-[state=closed]:zoom-out-95
      data-[state=open]:zoom-in-95
    "
  >
    {children}
  </DialogPrimitive.Content>
)
```

**Custom keyframe animations in tailwind.config.js:**
```js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        // Slide down (for dropdowns)
        slideDown: {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        slideUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Slide in from right (for toast)
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      animation: {
        slideDown: 'slideDown 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        slideUp: 'slideUp 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        slideInRight: 'slideInRight 200ms ease-out',
        slideOutRight: 'slideOutRight 150ms ease-in',
      },
    },
  },
}
```

### Toast Slide-In Animations

**Sonner handles this automatically**, but for custom toasts:

```tsx
const Toast = ({ visible, message }) => (
  <div
    className={`
      fixed bottom-4 right-4 z-50
      bg-background border shadow-lg rounded-lg p-4
      transition-all duration-300
      ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}
  >
    {message}
  </div>
)
```

### Hover States and Micro-Interactions

```tsx
// Button hover with scale
<Button className="transition-all hover:scale-105 active:scale-95">
  Click me
</Button>

// Card hover lift
<Card className="transition-all hover:shadow-xl hover:-translate-y-1">
  <TaskCard />
</Card>

// Checkbox with smooth transition
<input
  type="checkbox"
  className="
    w-5 h-5 rounded border-gray-300
    transition-all duration-200
    checked:bg-primary checked:border-primary
    focus:ring-2 focus:ring-primary focus:ring-offset-2
  "
/>

// Tag badge with interactive hover
<Badge className="transition-all hover:bg-primary/80 cursor-pointer">
  Work
</Badge>

// Delete button with destructive hover
<Button
  variant="ghost"
  className="
    text-muted-foreground
    hover:text-destructive hover:bg-destructive/10
    transition-colors
  "
>
  Delete
</Button>
```

### Loading States

```tsx
// Spinner component
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />

// Skeleton loading
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>

// Button loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      Saving...
    </>
  ) : (
    'Save Task'
  )}
</Button>
```

---

## 5. Accessibility Features to Include

### Keyboard Navigation

**Essential patterns:**
- Tab order follows visual flow
- ESC closes modals/dropdowns
- Enter/Space activates buttons
- Arrow keys navigate lists/menus

**Implementation:**
```tsx
// Modal with ESC to close (Radix handles this)
<Dialog>
  <DialogContent>
    {/* Radix auto-handles ESC, focus trap, return focus */}
  </DialogContent>
</Dialog>

// Dropdown with arrow navigation
<Select>
  <SelectTrigger />
  <SelectContent>
    {/* Radix handles arrow key navigation */}
    <SelectItem value="low">Low Priority</SelectItem>
    <SelectItem value="medium">Medium Priority</SelectItem>
    <SelectItem value="high">High Priority</SelectItem>
  </SelectContent>
</Select>
```

### ARIA Attributes

**Always include:**
```tsx
// Buttons with icon only
<Button aria-label="Delete task">
  <Trash2 className="h-4 w-4" />
</Button>

// Form inputs
<div>
  <Label htmlFor="task-title">Title</Label>
  <Input
    id="task-title"
    aria-describedby="title-error"
    aria-invalid={errors.title ? 'true' : 'false'}
  />
  {errors.title && (
    <span id="title-error" className="text-sm text-destructive">
      {errors.title}
    </span>
  )}
</div>

// Loading states
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {taskCount} tasks remaining
</div>
```

### Focus Management

```tsx
// Focus trap in modals (Radix handles this)
<Dialog>
  <DialogContent>
    {/* Focus automatically trapped inside */}
    <Input autoFocus />
    <Button>Save</Button>
    <Button>Cancel</Button>
  </DialogContent>
</Dialog>

// Focus visible states
<Button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Submit
</Button>

// Skip to content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded"
>
  Skip to main content
</a>
```

### Screen Reader Support

```tsx
// Visually hidden but available to screen readers
<span className="sr-only">Close dialog</span>

// Descriptive labels
<Button aria-label="Edit task: Buy groceries">
  <Edit className="h-4 w-4" />
</Button>

// Status announcements
<div role="status" aria-live="polite" className="sr-only">
  Task "Buy groceries" has been completed
</div>

// Loading announcements
<div role="status" aria-live="assertive" aria-atomic="true">
  {isLoading && <span className="sr-only">Loading tasks...</span>}
</div>
```

### Color Contrast

**Ensure WCAG AA compliance (4.5:1 for text):**

```tsx
// Good contrast examples
<p className="text-foreground">Main text (already has good contrast)</p>
<p className="text-muted-foreground">Secondary text (verify contrast)</p>

// Priority badges with sufficient contrast
<Badge variant="high" className="bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100">
  High Priority
</Badge>

// Links with underline for non-color indicators
<a className="text-primary underline hover:no-underline">
  Learn more
</a>
```

---

## 6. Recommended Component Library: shadcn/ui

### Why shadcn/ui for Your Todo App?

1. **Perfect for your stack**:
   - Built for Next.js 15 + React 19
   - Uses Tailwind CSS (already configured)
   - TypeScript-first
   - Works with your existing CSS variables

2. **You own the code**:
   - Components copied to your project
   - Full customization control
   - No breaking changes from package updates

3. **Accessibility included**:
   - Built on Radix UI primitives
   - ARIA attributes handled
   - Keyboard navigation working

4. **Minimal bundle impact**:
   - No runtime package
   - Only includes components you use
   - Tree-shakeable

### Installation Steps

```bash
cd frontend

# Initialize shadcn/ui
npx shadcn@latest init

# Answer prompts:
# ✔ Would you like to use TypeScript? yes
# ✔ Which style would you like to use? Default
# ✔ Which color would you like to use as base color? Slate
# ✔ Where is your global CSS file? app/globals.css
# ✔ Would you like to use CSS variables for colors? yes
# ✔ Where is your tailwind.config located? tailwind.config.js
# ✔ Configure the import alias for components: @/components
# ✔ Configure the import alias for utils: @/lib/utils

# Install components needed for todo app
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add dropdown-menu

# Install toast (uses sonner)
npm install sonner
npx shadcn@latest add sonner
```

### Component Structure After Installation

```
frontend/
├── components/
│   └── ui/
│       ├── button.tsx       ✅ Installed
│       ├── input.tsx        ✅ Installed
│       ├── textarea.tsx     ✅ Installed
│       ├── label.tsx        ✅ Installed
│       ├── select.tsx       ✅ Installed
│       ├── dialog.tsx       ✅ Installed
│       ├── badge.tsx        ✅ Installed
│       ├── card.tsx         ✅ Installed
│       ├── dropdown-menu.tsx ✅ Installed
│       └── sonner.tsx       ✅ Installed
├── lib/
│   └── utils.ts             ✅ Auto-created (cn helper)
```

### Example: Building TaskCard with shadcn/ui

```tsx
// components/TaskCard.tsx
'use client'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, Check } from 'lucide-react'
import { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (taskId: string) => void
}

export function TaskCard({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) {
  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1 flex-1">
          <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h3>
          <div className="flex gap-2">
            <Badge variant={task.priority}>{task.priority}</Badge>
            {task.tags?.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleComplete(task.id)}>
              <Check className="mr-2 h-4 w-4" />
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {task.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </CardContent>
      )}

      <CardFooter className="text-xs text-muted-foreground">
        {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
      </CardFooter>
    </Card>
  )
}
```

### Example: Task Form with Dialog

```tsx
// components/TaskFormDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (taskData: any) => void
  initialData?: any
}

export function TaskFormDialog({ open, onOpenChange, onSubmit, initialData }: TaskFormDialogProps) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    priority: 'medium',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await onSubmit(formData)
      toast.success(initialData ? 'Task updated!' : 'Task created!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to save task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 7. Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Install shadcn/ui CLI: `npx shadcn@latest init`
- [ ] Install base components: button, input, label, card, badge
- [ ] Install dialog and dropdown components
- [ ] Install sonner for toast notifications
- [ ] Install lucide-react for icons: `npm install lucide-react`
- [ ] Install class-variance-authority: `npm install class-variance-authority`

### Phase 2: Core Components (2-3 hours)
- [ ] Build TaskCard component with dropdown menu
- [ ] Build TaskFormDialog component
- [ ] Build ConfirmDialog component
- [ ] Build TaskList layout with responsive grid
- [ ] Add toast notifications to CRUD operations

### Phase 3: Form Components (1 hour)
- [ ] Wrap shadcn Input, Textarea, Select with proper labels
- [ ] Add form validation and error states
- [ ] Style priority select with colored badges
- [ ] Add date picker for due dates (optional: install @radix-ui/react-popover and date-fns)

### Phase 4: Responsive Polish (1-2 hours)
- [ ] Test all components on mobile (DevTools)
- [ ] Adjust touch targets (min 44px)
- [ ] Fix modal full-screen on mobile
- [ ] Optimize grid breakpoints for task list
- [ ] Test dark mode on all components

### Phase 5: Accessibility Audit (1 hour)
- [ ] Test keyboard navigation (Tab, Enter, ESC, Arrows)
- [ ] Add aria-labels to icon-only buttons
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify color contrast (use Lighthouse)
- [ ] Add focus-visible states to all interactive elements

---

## 8. Additional Resources

### Documentation
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **Sonner Toast**: https://sonner.emilkowal.ski

### Tools
- **Component Explorer**: https://ui.shadcn.com/blocks
- **Color Palette Generator**: https://uicolors.app
- **Contrast Checker**: https://webaim.org/resources/contrastchecker
- **Responsive Testing**: Chrome DevTools Device Mode

### Packages to Install

```json
{
  "dependencies": {
    "sonner": "^1.4.0",
    "lucide-react": "^0.309.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0"
  }
}
```

**Note**: These will be installed automatically when you run `npx shadcn@latest add <component>`.

---

## Summary

### Final Recommendation

**Use shadcn/ui** - it's the best fit for your project because:

1. You already have Tailwind CSS configured
2. You need accessible components (Radix UI primitives)
3. You want to customize without fighting a package
4. You need minimal bundle size impact
5. You're using Next.js 15 + TypeScript (perfect match)
6. Your existing CSS variables system matches shadcn's approach

### Quick Start Command

```bash
cd frontend
npx shadcn@latest init
npx shadcn@latest add button input textarea label select dialog badge card dropdown-menu
npm install sonner lucide-react
npx shadcn@latest add sonner
```

After this, you'll have production-ready, accessible, responsive components that integrate perfectly with your existing Tailwind setup.

---

**Next Steps**:
1. Run the installation commands
2. Start with TaskCard component
3. Build TaskFormDialog
4. Add toast notifications
5. Test responsiveness and accessibility
