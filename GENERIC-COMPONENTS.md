# Generic Components Documentation

This document describes the generic, reusable components in this project. These components are designed to be flexible, type-safe, and reusable across different features.

## Table of Contents

1. [DynamicElement](#dynamicelement)
2. [ListRenderer](#listrenderer)
3. [NavigationWrapper](#navigationwrapper)
4. [RouterLink](#routerlink)
5. [IconifyIcon](#iconifyicon)
6. [MediaCard](#mediacard)
7. [RadioButton](#radiobutton)

---

## DynamicElement

**Purpose**: Renders any HTML element dynamically based on the `as` prop while maintaining full type safety.

### Features

- ✅ Type-safe HTML element rendering
- ✅ Support for all standard HTML tags + `iconify-icon`
- ✅ Runtime validation of valid tags
- ✅ Full props forwarding with proper typing

### Props

```typescript
interface DynamicElementProps<T extends CustomHtmlTags> {
  as: T;
  children?: React.ReactNode;
  ...HTMLElementProps // All props for the specified element
}
```

### Usage Examples

```tsx
// Basic usage
<DynamicElement as="button" onClick={handleClick}>
  Click me
</DynamicElement>

// With TypeScript inference
<DynamicElement as="input" type="text" placeholder="Enter text" />

// Custom iconify-icon element
<DynamicElement as="iconify-icon" icon="mdi:home" />
```

### Use Cases

- Building polymorphic components
- Dynamic form element generation
- Type-safe wrapper components
- Custom element integration

---

## ListRenderer

**Purpose**: Generic list rendering component that handles any array data with any component type.

### Features

- ✅ Fully generic and type-safe
- ✅ Automatic UUID key generation fallback
- ✅ Index tracking for positioning/styling
- ✅ Support for readonly arrays
- ✅ Memoization-friendly

### Props

```typescript
interface ListRendererProps<TItem> {
  data: TItem[] | readonly TItem[];
  getKey?: (item: TItem) => string | number;
  renderComponent: ComponentType<{
    data: TItem;
    index: number;
    key?: string | number;
  }>;
}
```

### Usage Examples

```tsx
// Basic list rendering
<ListRenderer
  data={users}
  getKey={(user) => user.id}
  renderComponent={({ data, index }) => (
    <UserCard user={data} position={index} />
  )}
/>

// Navigation items
<ListRenderer
  data={NAV_ITEMS}
  getKey={(item) => item.label}
  renderComponent={({ data }) => (
    <RouterLink as="navLink" to={data.to}>
      {data.label}
    </RouterLink>
  )}
/>

// Without custom key (uses UUID fallback)
<ListRenderer
  data={items}
  renderComponent={({ data, index }) => (
    <div>Item {index}: {data.name}</div>
  )}
/>
```

### Use Cases

- Rendering any list of data
- Building container components
- Dynamic navigation generation
- Generic collection display

---

## NavigationWrapper

**Purpose**: Injects navigation functionality into child components using render props pattern.

### Features

- ✅ Render props pattern for maximum flexibility
- ✅ React Router integration
- ✅ Optional history replacement
- ✅ Memoized navigation function
- ✅ Type-safe callback injection

### Props

```typescript
interface NavigationWrapperProps {
  children: (navigateTo: () => void) => JSX.Element;
  shouldReplace?: boolean;
  to: string;
}
```

### Usage Examples

```tsx
// Basic navigation injection
<NavigationWrapper to="/dashboard">
  {(navigateTo) => (
    <button onClick={navigateTo}>
      Go to Dashboard
    </button>
  )}
</NavigationWrapper>

// With history replacement
<NavigationWrapper to="/login" shouldReplace>
  {(navigateTo) => (
    <CustomButton onPress={navigateTo}>
      Login
    </CustomButton>
  )}
</NavigationWrapper>

// Complex component integration
<NavigationWrapper to="/profile">
  {(navigateTo) => (
    <UserMenu
      onProfileClick={navigateTo}
      otherProps={...}
    />
  )}
</NavigationWrapper>
```

### Use Cases

- Adding navigation to non-link components
- Custom button navigation
- Complex component navigation integration
- Conditional navigation logic

---

## RouterLink

**Purpose**: Unified link component handling internal, external, and navigation links with consistent styling.

### Features

- ✅ Three link types: internal, external, navLink
- ✅ Automatic active state handling (navLink)
- ✅ Optional text decoration on hover
- ✅ New tab support for external links
- ✅ History replacement option
- ✅ Consistent styling across link types

### Props

```typescript
interface RouterLinkProps {
  as?: "external" | "internal" | "navLink";
  to: string;
  children?: JSX.Element | string | null;
  className?: string;
  activeClassName?: string;
  hasTextDecorationOnHover?: boolean;
  shouldOpenInNewTab?: boolean;
  shouldReplace?: boolean;
}
```

### Usage Examples

```tsx
// External link (default)
<RouterLink to="https://example.com" shouldOpenInNewTab>
  Visit Website
</RouterLink>

// Internal navigation
<RouterLink as="internal" to="/about">
  About Page
</RouterLink>

// Navigation with active state
<RouterLink
  as="navLink"
  to="/dashboard"
  activeClassName="active"
  hasTextDecorationOnHover
>
  Dashboard
</RouterLink>

// With styling
<RouterLink
  as="internal"
  to="/profile"
  className="btn btn-primary"
  shouldReplace
>
  Profile
</RouterLink>
```

### Use Cases

- Unified link handling across app
- Navigation menus
- External link management
- Styled link components

---

## IconifyIcon

**Purpose**: Type-safe wrapper for Iconify icons using DynamicElement.

### Features

- ✅ Type-safe iconify-icon usage
- ✅ Full Iconify icon library support
- ✅ All HTML props forwarding
- ✅ Built on DynamicElement

### Props

```typescript
type IconifyIconProps = JSX.IntrinsicElements["iconify-icon"];
```

### Usage Examples

```tsx
// Basic icon
<IconifyIcon icon="mdi:home" />

// Styled icon
<IconifyIcon
  icon="game-icons:flower-pot"
  className="logo"
  style={{ fontSize: '2rem' }}
/>

// Interactive icon
<IconifyIcon
  icon="mdi:menu"
  onClick={toggleMenu}
  role="button"
  tabIndex={0}
/>
```

### Use Cases

- Consistent icon usage
- Logo display
- UI element icons
- Interactive icon buttons

---

## MediaCard

**Purpose**: Reusable card component for displaying content with prominent images and attribution.

### Features

- ✅ Image with professional attribution
- ✅ Flexible content layout
- ✅ Configurable text alignment
- ✅ Responsive design
- ✅ External link attribution

### Props

```typescript
interface MediaCardProps {
  name: string;
  description: string;
  descriptionAlign?: "left" | "center";
  image: {
    fileName: string;
    authorName: string;
    authorLink: string;
    platformName: string;
    platformLink: string;
  };
}
```

### Usage Examples

```tsx
// Treatment card
<MediaCard
  name="Relaxing Massage"
  description="Restore your sense of peace and ease"
  descriptionAlign="left"
  image={{
    fileName: massageImage,
    authorName: "John Doe",
    authorLink: "https://...",
    platformName: "Unsplash",
    platformLink: "https://unsplash.com"
  }}
/>

// Staff profile
<MediaCard
  name="Dr. Jane Smith"
  description="Facial, Massage, Scrub"
  image={staffImageData}
/>
```

### Use Cases

- Product/service cards
- Staff profiles
- Portfolio items
- Content showcases

---

## RadioButton

**Purpose**: Accessible, styled radio button component with label integration.

### Features

- ✅ Fully accessible
- ✅ Custom styling
- ✅ Label integration
- ✅ Controlled component pattern
- ✅ Event handling

### Props

```typescript
interface RadioButtonProps {
  id: string;
  name: string;
  value: string;
  label: string;
  isChecked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
```

### Usage Examples

```tsx
// Basic radio button
<RadioButton
  id="option-1"
  name="selection"
  value="option1"
  label="Option 1"
  isChecked={selectedValue === "option1"}
  onChange={handleChange}
/>

// With custom styling
<RadioButton
  id="treatment-massage"
  name="treatment"
  value="massage"
  label="Massage"
  isChecked={selectedTreatment === "massage"}
  onChange={handleTreatmentChange}
  className="custom-radio"
/>
```

### Use Cases

- Form selections
- Filter options
- Settings toggles
- Survey responses

---

## Component Interaction Examples

### Complex Usage: Navigation Menu with ListRenderer and RouterLink

```tsx
const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

<nav>
  <ListRenderer
    data={navItems}
    getKey={(item) => item.label}
    renderComponent={({ data }) => (
      <RouterLink
        as="navLink"
        to={data.to}
        activeClassName="active"
        className="nav-item"
      >
        {data.label}
      </RouterLink>
    )}
  />
</nav>;
```

### Dynamic Form with DynamicElement

```tsx
const formFields = [
  { type: "input", inputType: "text", name: "name" },
  { type: "textarea", name: "message" },
  { type: "select", name: "category" },
];

<ListRenderer
  data={formFields}
  getKey={(field) => field.name}
  renderComponent={({ data }) => (
    <DynamicElement
      as={data.type}
      type={data.inputType}
      name={data.name}
      {...otherProps}
    />
  )}
/>;
```

## Best Practices

1. **Always provide keys** when using ListRenderer with dynamic data
2. **Use specific types** rather than `any` for better type safety
3. **Memoize expensive render functions** when using with ListRenderer
4. **Prefer RouterLink** over regular `<a>` tags for consistency
5. **Use NavigationWrapper** for non-link navigation needs
6. **Leverage DynamicElement** for polymorphic component patterns

## Performance Considerations

- ListRenderer automatically handles key generation with UUID fallback
- NavigationWrapper memoizes the navigation function
- All components are designed to work well with React.memo()
- Use getKey prop in ListRenderer for optimal reconciliation
