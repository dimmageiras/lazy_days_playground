# CSS Grid Pattern Library

A comprehensive guide to practical CSS Grid patterns and implementations. This document demonstrates common grid layouts with real-world examples, explaining when and how to use each pattern effectively.

---

## Table of Contents

1. [Full-Page Layout Patterns](#full-page-layout-patterns)
2. [Form Layout Patterns](#form-layout-patterns)
3. [Input Component Patterns](#input-component-patterns)
4. [Content Layout Patterns](#content-layout-patterns)
5. [Utility & UI Patterns](#utility--ui-patterns)
6. [Best Practices](#best-practices)

---

## Full-Page Layout Patterns

### Pattern 1: Full-Height Viewport Container

**Use Case:** Creating a container that fills the entire viewport height and controls overflow behavior for single-page applications.

**When to Use:**

- Building SPAs where you need precise control over scrolling
- Creating fixed layouts that shouldn't scroll at the body level
- Establishing a foundation for nested grid layouts

**Implementation:**

```css
body {
  display: grid;
  grid-template-rows: 1fr 0;
  height: 100vh;
  overflow: hidden;
}
```

**How It Works:**

- Creates a two-row grid where the main content takes full space (`1fr`)
- Second row has zero height, useful for positioning fixed elements
- `100vh` ensures full viewport height coverage
- `overflow: hidden` prevents unwanted scrolling at the body level

**Example Use:** Base layout for web applications, dashboards, or immersive experiences.

---

### Pattern 2: Fixed Header with Scrollable Content

**Use Case:** Creating an application layout with a persistent header and scrollable main content area.

**When to Use:**

- Building web apps with fixed navigation bars
- Dashboards with sticky toolbars
- Any interface where the header should remain visible while content scrolls

**Implementation:**

```css
.app-container {
  display: grid;
  grid-template-rows: 4rem 1fr;
  height: 100vh;
  overflow: hidden;
}

.app-container > header {
  /* Fixed header content */
}

.app-container > main {
  overflow-y: auto;
}
```

**How It Works:**

- First row has fixed height (`4rem`) for the header
- Second row uses `1fr` to fill remaining space
- Main content area enables vertical scrolling
- Header stays fixed at the top

**Example Use:** Admin panels, email clients, documentation sites, social media feeds.

---

## Form Layout Patterns

### Pattern 3: Auto-Flowing Form Fields

**Use Case:** Creating vertical form layouts where fields stack naturally with consistent spacing.

**When to Use:**

- Login forms, registration forms, contact forms
- Any form where fields should be stacked vertically
- Forms that need to adapt to different numbers of inputs

**Implementation:**

```css
.form-container {
  display: grid;
  gap: 1rem;
  /* Grid auto-creates rows as needed */
}

/* Optional: Control specific layouts */
.form-container.three-fields {
  grid-template-rows: 1fr 1fr 1fr auto;
}

.form-container.three-fields > *:nth-child(3) {
  grid-row: 4; /* Move button to row 4 */
}
```

**How It Works:**

- Grid automatically creates rows for each child element
- `gap` provides consistent spacing between all fields
- Can override row placement for specific children (like submit buttons)
- Adapts naturally to different numbers of fields

**Example HTML:**

```html
<form class="form-container">
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
```

**Example Use:** Authentication forms, survey forms, settings panels.

---

## Input Component Patterns

### Pattern 4: Text Input with Floating Label

**Use Case:** Creating sophisticated input fields with labels that float above when filled, and display error messages below.

**When to Use:**

- Modern form designs with Material Design-style inputs
- When you need label, input, and error message in a compact vertical space
- Forms where you want visual feedback without JavaScript positioning

**Implementation:**

```css
.input-container {
  display: grid;
  grid-template-rows: 1.2rem auto 1.125rem;
  gap: 0.5rem;
}

.input-container .label {
  grid-row: 1;
  transition: all 0.2s ease;
}

.input-container .input {
  grid-row: 2;
}

.input-container .error-message {
  grid-row: 3;
  font-size: 0.875rem;
  color: #e53e3e;
}

/* Floating label when input is empty */
.input-container:not(.filled):not(.focused) .label.floating {
  grid-row: 2; /* Move to overlap input */
  align-self: center;
  padding-left: 1rem;
  pointer-events: none;
}
```

**How It Works:**

- Three distinct rows for label, input, and error message
- Label can transition between row 1 (default) and row 2 (floating)
- Grid handles all positioning without absolute/relative tricks
- Error message space is always reserved (prevents layout shift)

**Example HTML:**

```html
<div class="input-container">
  <label class="label floating">Email Address</label>
  <input type="email" class="input" />
  <span class="error-message">Please enter a valid email</span>
</div>
```

**Example Use:** Registration forms, checkout flows, user profile editors.

---

### Pattern 5: Custom Radio Buttons with Labels

**Use Case:** Creating custom-styled radio buttons that align perfectly with their labels and support hover effects.

**When to Use:**

- Building custom form controls that match your brand
- When default radio buttons don't fit your design
- Forms requiring enhanced visual feedback

**Implementation:**

```css
.radio-button {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  position: relative;
}

/* Hover background effect */
.radio-button::before {
  content: "";
  grid-area: 1 / 1 / -1 / -1; /* Span entire grid */
  background-color: transparent;
  border-radius: 50px;
  transition: background-color 0.2s ease;
  width: calc(100% + 1.5rem);
  height: calc(100% + 0.5rem);
  justify-self: center;
}

.radio-button:hover::before {
  background-color: rgba(0, 0, 0, 0.05);
}

.radio-button input {
  grid-area: 1 / 1;
  width: 1rem;
  height: 1rem;
  appearance: none;
  border-radius: 50%;
  border: 2px solid #ccc;
}

.radio-button input:checked {
  background-color: #3182ce;
  border-color: #3182ce;
}

.radio-button label {
  grid-area: 1 / 2;
  user-select: none;
}
```

**How It Works:**

- Two columns: first for radio button, second for label
- Pseudo-element spans entire grid for hover effect
- Input and label positioned in separate grid cells
- Perfect vertical alignment with `align-items: center`

**Example HTML:**

```html
<div class="radio-button">
  <input type="radio" id="option1" name="choice" />
  <label for="option1">Option 1</label>
</div>
```

**Example Use:** Survey forms, quiz applications, settings pages.

---

### Pattern 6: Custom Checkboxes with Animated Icons

**Use Case:** Creating checkboxes with custom styling and animated checkmark icons that layer perfectly.

**When to Use:**

- Custom form controls with brand-specific styling
- Interfaces requiring visual confirmation of selection
- Forms with multiple selection options

**Implementation:**

```css
.checkbox {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
}

/* Hover background */
.checkbox::before {
  content: "";
  grid-area: 1 / 1 / -1 / -1;
  background-color: transparent;
  border-radius: 50px;
  transition: background-color 0.2s ease;
}

.checkbox:hover::before {
  background-color: rgba(0, 0, 0, 0.05);
}

.checkbox input {
  grid-area: 1 / 1;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ccc;
  border-radius: 0.125rem;
  transition: all 0.2s ease;
}

.checkbox input:checked {
  background-color: #3182ce;
  border-color: #3182ce;
}

/* Checkmark icon overlays input in same cell */
.checkbox .checkmark {
  grid-area: 1 / 1;
  color: white;
  font-size: 0.7rem;
  pointer-events: none;
  justify-self: center;
  align-self: center;
}

.checkbox label {
  grid-area: 1 / 2;
  user-select: none;
}
```

**How It Works:**

- Multiple elements occupy same grid cell (1/1) for perfect layering
- Hover background, checkbox input, and checkmark all stack in column 1
- Grid ensures all elements align without manual positioning
- Label sits in separate column for clean separation

**Example HTML:**

```html
<div class="checkbox">
  <input type="checkbox" id="agree" />
  <span class="checkmark">✓</span>
  <label for="agree">I agree to terms</label>
</div>
```

**Example Use:** Terms acceptance, multi-select lists, filter controls.

---

## Content Layout Patterns

### Pattern 7: Overlay Layout with Background

**Use Case:** Creating full-screen hero sections with background images and centered content.

**When to Use:**

- Landing pages with hero sections
- Full-screen modals with backdrop
- Image galleries with overlay controls
- Video players with UI overlays

**Implementation:**

```css
.hero-section {
  display: grid;
  min-height: 100vh;
  overflow: hidden;
}

.hero-section .background {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-section .content {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1;
}
```

**How It Works:**

- Both background and content use `grid-area: 1 / 1` to occupy same cell
- Content naturally layers over background
- No need for absolute positioning
- Use z-index for stacking order control

**Example HTML:**

```html
<section class="hero-section">
  <img src="background.jpg" class="background" alt="" />
  <div class="content">
    <h1>Welcome</h1>
    <p>Your content here</p>
  </div>
</section>
```

**Example Use:** Landing pages, splash screens, promotional banners.

---

### Pattern 8: Centered Content with Side Margins

**Use Case:** Creating layouts where main content is centered with optional side controls that overlap.

**When to Use:**

- Headers with centered titles and side buttons
- Navigation bars with centered logo
- Toolbars with centered text and action buttons

**Implementation:**

```css
.header {
  display: grid;
  grid-template-columns: 2.5rem 1fr 2.5rem;
  padding: 1rem;
}

.header .title {
  grid-column: 1 / -1; /* Span all columns */
  grid-row: 1;
  justify-self: center;
  align-self: center;
}

.header .actions {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  align-self: center;
  z-index: 1;
}
```

**How It Works:**

- Three columns: fixed side margins with flexible center
- Main content spans all columns for perfect centering
- Side elements positioned in specific columns
- Elements can overlap while maintaining alignment

**Example HTML:**

```html
<header class="header">
  <h1 class="title">Calendar - November 2025</h1>
  <div class="actions">
    <button>Settings</button>
  </div>
</header>
```

**Example Use:** App headers, calendar navigation, page headers with controls.

---

### Pattern 9: Equal-Column Repeating Grid

**Use Case:** Creating grids where items are displayed in equal columns that wrap automatically.

**When to Use:**

- Calendar layouts (7 days per week)
- Image galleries with consistent columns
- Product grids
- Dashboard widgets

**Implementation:**

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
  padding: 2rem;
}

.calendar-grid .day {
  aspect-ratio: 1;
  border: 1px solid #ccc;
  padding: 0.5rem;
}

/* Responsive: 4 columns on tablets */
@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Responsive: 2 columns on mobile */
@media (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**How It Works:**

- `repeat(7, 1fr)` creates 7 equal-width columns
- Grid auto-creates new rows as items wrap
- Perfect for repeating patterns like calendars
- Easily responsive with media queries

**Example HTML:**

```html
<div class="calendar-grid">
  <div class="day">1</div>
  <div class="day">2</div>
  <!-- ... 30 more days ... -->
</div>
```

**Example Use:** Calendars, photo grids, product catalogs, icon sets.

---

## Utility & UI Patterns

### Pattern 10: Corner-Positioned Popup with Toggle

**Use Case:** Creating floating UI elements (tooltips, popups, notifications) positioned in a corner with a toggle button.

**When to Use:**

- Developer tools panels
- Chat widgets
- Help/support popups
- Notification centers
- Action menus

**Implementation:**

```css
.floating-panel {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
}

.floating-panel .popup {
  grid-column: 1 / -1; /* Span both columns */
  grid-row: 1;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
}

.floating-panel .toggle-button {
  grid-column: 2;
  grid-row: 2;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #3182ce;
  color: white;
}

/* Hidden state */
.floating-panel.hidden .popup {
  display: none;
}
```

**How It Works:**

- Two-by-two grid provides flexible positioning
- Popup spans entire top row for full width
- Toggle button sits in bottom-right cell
- Grid naturally handles spacing and alignment

**Example HTML:**

```html
<div class="floating-panel">
  <div class="popup">
    <h3>Help Center</h3>
    <ul>
      <li>FAQ</li>
      <li>Contact Support</li>
    </ul>
  </div>
  <button class="toggle-button">?</button>
</div>
```

**Example Use:** Chat widgets, support panels, keyboard shortcuts menu, settings popup.

---

### Pattern 11: Icon + Label Buttons

**Use Case:** Creating consistent button layouts with icons and text labels side-by-side.

**When to Use:**

- Navigation buttons
- Action buttons with icons
- Social media share buttons
- Download/upload buttons
- Standardizing third-party UI components

**Implementation:**

```css
.icon-button {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f7fafc;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.icon-button:hover {
  background-color: #edf2f7;
}

.icon-button .icon {
  grid-column: 1;
  width: 1rem;
  height: 1rem;
  color: #4a5568;
}

.icon-button .label {
  grid-column: 2;
  font-size: 0.875rem;
  color: #2d3748;
  white-space: nowrap;
}

/* Alternative: Label via pseudo-element */
.icon-button::after {
  content: attr(data-label);
  grid-column: 2;
  font-size: 0.875rem;
}
```

**How It Works:**

- Two-column grid with icon sized to content, label fills remaining space
- Grid ensures perfect vertical alignment
- Can use real elements or pseudo-elements for labels
- Consistent spacing with `gap` property

**Example HTML:**

```html
<!-- With separate elements -->
<button class="icon-button">
  <svg class="icon">...</svg>
  <span class="label">Download</span>
</button>

<!-- With data attribute -->
<button class="icon-button" data-label="Share">
  <svg class="icon">...</svg>
</button>
```

**Example Use:** Toolbar buttons, navigation items, social sharing, file operations.

---

## Best Practices

### Key Takeaways

**1. Use Grid for 2D Layouts, Flexbox for 1D**

- Grid excels when you need to control both rows and columns
- Use Flexbox inside grid cells for single-direction alignment
- Combine both for maximum flexibility

**2. Leverage `fr` Units for Flexible Sizing**

```css
/* Instead of percentages */
grid-template-columns: 1fr 2fr 1fr; /* 25% 50% 25% but better */
```

- `fr` units are more intuitive than percentages
- They automatically account for gaps
- More maintainable and readable

**3. Grid for Perfect Overlays**

```css
.overlay-container {
  display: grid;
}

.background,
.content {
  grid-area: 1 / 1; /* Both in same cell */
}
```

- No need for `position: absolute`
- Better accessibility and flow
- Easier to maintain

**4. Use `gap` Instead of Margins**

```css
/* Instead of margins on children */
.grid {
  display: grid;
  gap: 1rem; /* Clean and consistent */
}
```

- Gaps only appear between items
- No margin collapsing issues
- Simpler CSS

**5. Auto-Flow for Repeating Patterns**

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
```

- Automatically creates rows as needed
- Responsive without media queries
- Perfect for cards, galleries, lists

**6. Named Grid Areas for Complex Layouts**

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content aside"
    "footer footer footer";
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
```

- More readable and maintainable
- Easy to restructure layouts
- Visual representation in CSS

**7. Span Syntax for Element Placement**

```css
/* These are equivalent */
grid-column: 1 / -1; /* Span from first to last */
grid-column: 1 / 4; /* Span 3 columns */
grid-column: span 3; /* Span 3 columns */
```

**8. Alignment Properties**

```css
.container {
  /* Align all items */
  align-items: center; /* Vertical alignment of items */
  justify-items: center; /* Horizontal alignment of items */

  /* Align grid within container */
  align-content: center; /* Vertical alignment of grid */
  justify-content: center; /* Horizontal alignment of grid */
}

.item {
  /* Align individual item */
  align-self: end;
  justify-self: start;
}
```

---

## Common Grid Patterns Summary

| Pattern                               | Use Case             | Key Properties                               |
| ------------------------------------- | -------------------- | -------------------------------------------- |
| **Full-Height Container**             | SPAs, dashboards     | `grid-template-rows: 1fr 0`, `height: 100vh` |
| **Fixed Header + Scrollable Content** | App layouts          | `grid-template-rows: 4rem 1fr`               |
| **Auto-Flowing Forms**                | Forms                | `display: grid`, `gap`                       |
| **Floating Labels**                   | Input fields         | `grid-template-rows: 1.2rem auto 1rem`       |
| **Icon + Label**                      | Buttons, links       | `grid-template-columns: auto 1fr`            |
| **Overlay Layout**                    | Hero sections        | Both children use `grid-area: 1 / 1`         |
| **Centered with Margins**             | Headers              | `grid-template-columns: 2.5rem 1fr 2.5rem`   |
| **Equal Columns**                     | Calendars, galleries | `repeat(7, 1fr)`                             |
| **Corner Popup**                      | Chat widgets         | 2×2 grid with spanning                       |
| **Responsive Grid**                   | Product grids        | `repeat(auto-fill, minmax(200px, 1fr))`      |

---

## Quick Reference

### Essential Grid Properties

```css
/* Container Properties */
display: grid;
grid-template-columns: /* column sizes */ ;
grid-template-rows: /* row sizes */ ;
grid-template-areas: /* named areas */ ;
gap: /* spacing between cells */ ;
align-items: /* vertical alignment of items */ ;
justify-items: /* horizontal alignment of items */ ;

/* Item Properties */
grid-column: /* column position */ ;
grid-row: /* row position */ ;
grid-area: /* named area or shorthand */ ;
align-self: /* override vertical alignment */ ;
justify-self: /* override horizontal alignment */ ;
```

### Unit Types

- `fr` - Fraction of available space
- `auto` - Size based on content
- `minmax(min, max)` - Range of sizes
- `repeat(count, size)` - Repeat pattern
- `%` - Percentage of container
- Fixed units (`px`, `rem`, `em`)

---

## Resources & Further Reading

- [CSS Grid Layout MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [A Complete Guide to Grid (CSS-Tricks)](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Grid by Example](https://gridbyexample.com/)
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/)

---

This guide demonstrates **11 practical CSS Grid patterns** that cover most common layout scenarios in modern web development, from full-page structures to micro-interactions.
