# Generic Components Documentation

This document provides a comprehensive guide to all generic components available in our project. These components are designed to be reusable across different parts of the application and provide consistent functionality and styling.

## Table of Contents

### 🧭 [Navigation & Routing Components](#navigation--routing-components)

1. [NavigationWrapper](#navigationwrapper)
2. [RouterLink](#routerlink)

### 📝 [Form Components](#form-components)

1. [CheckBox](#checkbox)
2. [RadioButton](#radiobutton)

### 🎨 [UI & Display Components](#ui--display-components)

1. [IconifyIcon](#iconifyicon)
2. [MediaCard](#mediacard)
3. [PageTitle](#pagetitle)

### 🔧 [Utility Components](#utility-components)

1. [ClientOnly](#clientonly)
2. [DynamicElement](#dynamicelement)
3. [ListRenderer](#listrenderer)

---

## Navigation & Routing Components

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

### RouterLink

A type-safe link component with three distinct variants that handles both internal routing and external links with consistent styling and behavior. Uses discriminated union types with the 'as' prop as the discriminator.

**Common Props (all variants):**

- `children?: JSX.Element | string | null` - Link content
- `className?: string` - Additional CSS classes
- `hasTextDecorationOnHover?: boolean` - Show underline on hover (default: false)
- `ref?: Ref<HTMLAnchorElement | null>` - Ref for the anchor element

**External Link Props (as="external"):**

- `to?: string` - External URL
- `shouldOpenInNewTab?: boolean` - Open in new tab (default: false)

**Internal Link Props (as="internal"):**

- `to: string | Path` - Route path or configuration object
- `shouldReplace?: boolean` - Replace history entry (default: false)

**Navigation Link Props (as="navLink"):**

- `to: string | Path` - Route path or configuration object
- `activeClassName?: string` - CSS class for active state
- `shouldReplace?: boolean` - Replace history entry (default: false)

**Usage Examples:**

```tsx
// External link with security attributes
<RouterLink
  as="external"
  shouldOpenInNewTab
  to="https://example.com"
>
  Visit Example
</RouterLink>

// Internal route with path object
<RouterLink
  as="internal"
  to={{
    pathname: "/dashboard",
    search: "?tab=overview"
  }}
>
  Go to Dashboard
</RouterLink>

// Navigation link with active state
<RouterLink
  activeClassName="active-nav-item"
  as="navLink"
  to="/profile"
>
  Profile
</RouterLink>
```

**Features:**

- Type-safe props based on link variant
- Automatic security attributes for external links (rel="noopener noreferrer")
- React Router integration for internal navigation
- Active state support for navigation links

---

## Form Components

### CheckBox

A styled checkbox component with custom check mark icon and consistent form handling.

**Props:**

- `id: string` - Unique identifier for the checkbox
- `isChecked: boolean` - Checked state (default: false)
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

A styled radio button component with consistent form handling and visual feedback. This component is memoized to prevent unnecessary re-renders when props haven't changed.

**Props:**

- `id: string` - Unique identifier for the radio button
- `isChecked: boolean` - Checked state (default: false)
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
  onChange={(e) => setSelectedPlan(e.target.value)}
  value="basic"
/>
<RadioButton
  id="plan-premium"
  isChecked={selectedPlan === 'premium'}
  label="Premium Plan"
  name="subscription-plan"
  onChange={(e) => setSelectedPlan(e.target.value)}
  value="premium"
/>
```

### TextInput

A styled text input component with enhanced security features and built-in protection against unwanted password manager interference.

**Props:**

- `type: "text" | "email" | "password"` - Type of text input to render
- All standard input attributes are supported except 'type'

**Usage Example:**

```tsx
// Basic text input
<TextInput
  name="username"
  placeholder="Enter username"
  type="text"
/>

// Email input with validation
<TextInput
  name="email"
  required
  type="email"
/>

// Secure password input
<TextInput
  name="password"
  type="password"
/>
```

---

## UI & Display Components

### Card

A base card component that provides a consistent container style for content. This component can be used as a building block for more specific card implementations.

**Props:**

- `children: ReactNode` - The content to be rendered inside the card
- `isHidden?: boolean` - Whether the card should be hidden (default: false)

**Usage Example:**

```tsx
<Card isHidden={false}>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```

### IconifyIcon

A wrapper component for Iconify icons with type safety and consistent integration. This component is memoized to prevent unnecessary re-renders when props haven't changed.

**Props:**

- `flip?: string` - Flip icon ("horizontal", "vertical", or "horizontal,vertical")
- `height?: string | number` - Icon height
- `icon: string` - Iconify icon name (e.g., "streamline-sharp:check-solid")
- `inline?: boolean` - Changes vertical alignment
- `rotate?: string | number` - Rotate icon (e.g., "90deg", "180deg")
- `width?: string | number` - Icon width
- All other standard iconify-icon element props are supported

**Usage Example:**

```tsx
<IconifyIcon
  className="nav-icon"
  height="24"
  icon="material-symbols:home"
  width="24"
/>

// With transformations
<IconifyIcon
  flip="horizontal"
  icon="bi:arrow-right"
  rotate="90deg"
/>
```

### MediaCard

A card component designed for displaying media content with image, title, description, and image attribution. This component is memoized to prevent unnecessary re-renders when props haven't changed.

**Props:**

- `description: string` - Card description
- `descriptionAlign?: 'left' | 'center'` - Text alignment for description (default: 'center')
- `image: object` - Image configuration:
  - `authorLink: string` - Link to author profile
  - `authorName: string` - Image author name
  - `fileName: string` - Image source URL
  - `platformLink: string` - Link to platform
  - `platformName: string` - Platform name (e.g., "Unsplash")
- `isHidden?: boolean` - Whether the card should be hidden (default: false)
- `name: string` - Card title

**Usage Example:**

```tsx
<MediaCard
  description="Experience ultimate relaxation with our therapeutic massage treatments."
  descriptionAlign="center"
  image={{
    authorLink: "https://unsplash.com/@johndoe",
    authorName: "John Doe",
    fileName: "/images/massage.jpg",
    platformLink: "https://unsplash.com",
    platformName: "Unsplash",
  }}
  name="Relaxing Massage"
/>
```

### PageTitle

A consistent page title component that renders as an h2 element with standardized styling.

**Props:**

- `className?: string` - Additional CSS classes
- `pageTitle: string` - The title text to display
- All other standard h2 props are supported

**Usage Example:**

```tsx
<PageTitle pageTitle="User Dashboard" className="custom-title-style" />
```

---

## Utility Components

### ClientOnly

Renders its children **only after** the component has mounted on the client. This avoids SSR-mismatch warnings when a child needs browser-only APIs (e.g. `window`, `document`, chart libraries).

**Props:**

— `children: ReactNode` – elements to render once mounted

**Usage Example:**

```tsx
<ClientOnly>
  <HeavyChart data={data} />
</ClientOnly>
```

### DynamicElement

A type-safe component for rendering dynamic HTML elements, including custom elements like iconify-icon. Uses DynamicElementHelper with memoized tag validation for optimal performance.

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

A utility component for efficiently rendering lists with automatic key generation and error handling. Uses ListRendererBase internally for optimized rendering and key management. Will throw an error if the data prop is not an array.

**Props:**

- `data: TItem[] | readonly TItem[]` - Array of items to render
- `getKey?: (item: TItem, index: number) => number | string` - Optional key extraction function (falls back to UUID)
- `renderComponent: (props: { data: TItem; index: number }) => JSX.Element` - Render function for each item

**Usage Examples:**

```tsx
// Simple list rendering
<ListRenderer
  data={users}
  getKey={(user) => user.id}
  renderComponent={({ data: user, index }) => (
    <div>
      {index + 1}. {user.name}
    </div>
  )}
/>

// Complex list with custom components
<ListRenderer
  data={products}
  getKey={(product) => product.sku}
  renderComponent={({ data: product }) => (
    <MediaCard
      name={product.name}
      description={product.description}
      image={product.image}
    />
  )}
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

- `DynamicElement` helper functions are memoized for optimal performance
- `IconifyIcon` is memoized to prevent unnecessary re-renders when props haven't changed
- `ListRenderer` uses stable keys to prevent unnecessary re-renders
- `MediaCard` is memoized to prevent unnecessary re-renders when props haven't changed
- `NavigationWrapper` uses `useCallback` and `useMemo` for optimization
- `RadioButton` is memoized to prevent unnecessary re-renders when props haven't changed
- Components use appropriate performance optimizations when needed

### 5. **Consistency**

- Use these generic components instead of creating one-off solutions
- Follow the established patterns for props and naming conventions
- Maintain consistent spacing and visual hierarchy

---

## Development Guidelines

### Adding New Generic Components

When creating new generic components:

1. **Location**: Place in `client/components/ComponentName/`
2. **Structure**: Include `index.ts`, `ComponentName.tsx`, and `ComponentName.module.scss`
3. **TypeScript**: Use proper interfaces and generic types where appropriate
4. **Testing**: Ensure components work in isolation and with various prop combinations
5. **Documentation**: Update this file with the new component details

### Modifying Existing Components

- Maintain backward compatibility when possible
- Update TypeScript interfaces if props change
- Test existing usage patterns throughout the application
- Update documentation to reflect changes
