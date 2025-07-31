# Generic Components Documentation

This document provides a comprehensive guide to all generic components available in our project. These components are designed to be reusable across different parts of the application and provide consistent functionality and styling.

## Table of Contents

### 🧭 [Navigation & Routing Components](#navigation--routing-components)

1. [RouterLink](#routerlink)
2. [NavigationWrapper](#navigationwrapper)

### 📝 [Form Components](#form-components)

1. [CheckBox](#checkbox)
2. [RadioButton](#radiobutton)

### 🎨 [UI & Display Components](#ui--display-components)

1. [PageTitle](#pagetitle)
2. [MediaCard](#mediacard)
3. [IconifyIcon](#iconifyicon)

### 🔧 [Utility Components](#utility-components)

1. [DynamicElement](#dynamicelement)
2. [ListRenderer](#listrenderer)

---

## Navigation & Routing Components

### RouterLink

A flexible link component that handles both internal routing and external links with consistent styling and behavior.

**Props:**

- `to: string` - The destination URL or route
- `as?: 'external' | 'internal' | 'navLink'` - Link type (default: 'external')
- `children?: JSX.Element | string | null` - Link content
- `className?: string` - Additional CSS classes
- `activeClassName?: string` - CSS class for active NavLink
- `hasTextDecorationOnHover?: boolean` - Show underline on hover (default: false)
- `shouldOpenInNewTab?: boolean` - Open external links in new tab (default: false)
- `shouldReplace?: boolean` - Replace current history entry (default: false)
- `ref?: Ref<HTMLAnchorElement | null>` - Ref for the anchor element

**Usage Examples:**

```tsx
// External link
<RouterLink to="https://example.com" shouldOpenInNewTab>
  Visit Example
</RouterLink>

// Internal route
<RouterLink as="internal" to="/dashboard">
  Go to Dashboard
</RouterLink>

// Navigation link with active state
<RouterLink
  as="navLink"
  to="/profile"
  activeClassName="active-nav-item"
>
  Profile
</RouterLink>
```

### NavigationWrapper

A render prop component that provides navigation functionality to child components, useful for creating custom clickable elements.

**Props:**

- `children: (navigateTo: () => void) => JSX.Element` - Render function that receives navigation callback
- `to: string` - Destination route
- `shouldReplace?: boolean` - Replace current history entry (default: false)

**Usage Example:**

```tsx
<NavigationWrapper to="/settings" shouldReplace>
  {(navigateTo) => (
    <button onClick={navigateTo} className="custom-button">
      Go to Settings
    </button>
  )}
</NavigationWrapper>
```

---

## Form Components

### CheckBox

A styled checkbox component with custom check mark icon and consistent form handling.

**Props:**

- `id: string` - Unique identifier for the checkbox
- `isChecked: boolean` - Checked state
- `label: string` - Label text
- `name: string` - Form field name
- `value: string` - Form field value
- `onChange: (event: ChangeEvent<HTMLInputElement>) => void` - Change handler
- `className?: string` - Additional CSS classes
- `inputRef?: Ref<HTMLInputElement>` - Ref for the input element

**Usage Example:**

```tsx
const [isSubscribed, setIsSubscribed] = useState(false);

<CheckBox
  id="newsletter-subscription"
  isChecked={isSubscribed}
  label="Subscribe to newsletter"
  name="newsletter"
  value="subscribed"
  onChange={(e) => setIsSubscribed(e.target.checked)}
/>;
```

### RadioButton

A styled radio button component with consistent form handling and visual feedback.

**Props:**

- `id: string` - Unique identifier for the radio button
- `isChecked: boolean` - Checked state
- `label: string` - Label text
- `name: string` - Form field name (should be same for grouped radio buttons)
- `value: string` - Form field value
- `onChange: (event: ChangeEvent<HTMLInputElement>) => void` - Change handler
- `className?: string` - Additional CSS classes
- `inputRef?: Ref<HTMLInputElement>` - Ref for the input element

**Usage Example:**

```tsx
const [selectedPlan, setSelectedPlan] = useState('');

<RadioButton
  id="plan-basic"
  isChecked={selectedPlan === 'basic'}
  label="Basic Plan"
  name="subscription-plan"
  value="basic"
  onChange={(e) => setSelectedPlan(e.target.value)}
/>
<RadioButton
  id="plan-premium"
  isChecked={selectedPlan === 'premium'}
  label="Premium Plan"
  name="subscription-plan"
  value="premium"
  onChange={(e) => setSelectedPlan(e.target.value)}
/>
```

---

## UI & Display Components

### PageTitle

A consistent page title component that renders as an h2 element with standardized styling.

**Props:**

- `pageTitle: string` - The title text to display
- `className?: string` - Additional CSS classes
- All other standard h2 props are supported

**Usage Example:**

```tsx
<PageTitle pageTitle="User Dashboard" className="custom-title-style" />
```

### MediaCard

A card component designed for displaying media content with image, title, description, and image attribution.

**Props:**

- `name: string` - Card title
- `description: string` - Card description
- `descriptionAlign?: 'left' | 'center'` - Text alignment for description (default: 'center')
- `image: object` - Image configuration:
  - `fileName: string` - Image source URL
  - `authorName: string` - Image author name
  - `authorLink: string` - Link to author profile
  - `platformName: string` - Platform name (e.g., "Unsplash")
  - `platformLink: string` - Link to platform

**Usage Example:**

```tsx
<MediaCard
  name="Relaxing Massage"
  description="Experience ultimate relaxation with our therapeutic massage treatments."
  descriptionAlign="center"
  image={{
    fileName: "/images/massage.jpg",
    authorName: "John Doe",
    authorLink: "https://unsplash.com/@johndoe",
    platformName: "Unsplash",
    platformLink: "https://unsplash.com",
  }}
/>
```

### IconifyIcon

A wrapper component for Iconify icons with type safety and consistent integration.

**Props:**

- `icon: string` - Iconify icon name (e.g., "streamline-sharp:check-solid")
- `width?: string | number` - Icon width
- `height?: string | number` - Icon height
- `flip?: string` - Flip icon ("horizontal", "vertical", or "horizontal,vertical")
- `rotate?: string | number` - Rotate icon (e.g., "90deg", "180deg")
- `inline?: boolean` - Changes vertical alignment
- All other standard iconify-icon element props are supported

**Usage Example:**

```tsx
<IconifyIcon
  icon="material-symbols:home"
  className="nav-icon"
  width="24"
  height="24"
/>

// With transformations
<IconifyIcon
  icon="bi:arrow-right"
  rotate="90deg"
  flip="horizontal"
/>
```

---

## Utility Components

### DynamicElement

A type-safe component for rendering dynamic HTML elements, including custom elements like iconify-icon.

**Props:**

- `as: CustomHtmlTags` - The HTML tag to render
- `children?: ReactNode` - Child content
- All props corresponding to the specified HTML element are supported

**Usage Examples:**

```tsx
// Render a div
<DynamicElement as="div" className="wrapper">
  Content here
</DynamicElement>

// Render custom iconify-icon element
<DynamicElement as="iconify-icon" icon="material-symbols:star" />

// Render a section
<DynamicElement as="section" role="banner">
  <h1>Page Header</h1>
</DynamicElement>
```

### ListRenderer

A utility component for efficiently rendering lists with automatic key generation and error handling.

**Props:**

- `data: TItem[] | readonly TItem[]` - Array of items to render
- `renderComponent: (props: { data: TItem; index: number }) => JSX.Element` - Render function for each item
- `getKey?: (item: TItem) => number | string` - Optional key extraction function (falls back to UUID)

**Usage Examples:**

```tsx
// Simple list rendering
<ListRenderer
  data={users}
  renderComponent={({ data: user, index }) => (
    <div key={user.id}>
      {index + 1}. {user.name}
    </div>
  )}
  getKey={(user) => user.id}
/>

// Complex list with custom components
<ListRenderer
  data={products}
  renderComponent={({ data: product }) => (
    <MediaCard
      name={product.name}
      description={product.description}
      image={product.image}
    />
  )}
  getKey={(product) => product.sku}
/>
```

---

## Best Practices

### 1. **Type Safety**

- All components are built with TypeScript and provide full type safety
- Use the provided prop interfaces for better development experience

### 2. **Styling**

- Components use CSS Modules for scoped styling
- Add custom classes via `className` prop when needed
- Follow the existing design system patterns
- **Prefer pure CSS Grid over absolute/relative positioning** for layout control
  - Use `display: grid` with `grid-template-columns/rows` for structured layouts
  - Leverage `grid-area` for precise element placement
  - See examples in `CheckBox`, `RadioButton`, and `Calendar/Header` components

### 3. **Accessibility**

- Form components include proper labeling and ARIA attributes
- Use semantic HTML elements when possible
- Test with screen readers and keyboard navigation

### 4. **Performance**

- `ListRenderer` uses React keys for efficient re-rendering
- `NavigationWrapper` uses `useCallback` and `useMemo` for optimization
- Components are designed to minimize unnecessary re-renders

### 5. **Consistency**

- Use these generic components instead of creating one-off solutions
- Follow the established patterns for props and naming conventions
- Maintain consistent spacing and visual hierarchy

---

## Development Guidelines

### Adding New Generic Components

When creating new generic components:

1. **Location**: Place in `src/components/ComponentName/`
2. **Structure**: Include `index.ts`, `ComponentName.tsx`, and `ComponentName.module.scss`
3. **TypeScript**: Use proper interfaces and generic types where appropriate
4. **Testing**: Ensure components work in isolation and with various prop combinations
5. **Documentation**: Update this file with the new component details

### Modifying Existing Components

- Maintain backward compatibility when possible
- Update TypeScript interfaces if props change
- Test existing usage patterns throughout the application
- Update documentation to reflect changes
