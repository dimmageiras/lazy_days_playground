Use `Reflect` methods for object access operations instead of direct property access when dealing with dynamic properties or when you need more predictable behavior.

## Benefits of Reflect

- More predictable error handling
- Consistent return values
- Better integration with Proxies
- Cleaner code for dynamic property access
- Functional programming style

## Property Access

```ts
// BAD - Direct property access
const getValue = (obj: Record<string, unknown>, key: string) => {
  return obj[key];
};

// GOOD - Using Reflect.get
const getValue = (obj: Record<string, unknown>, key: string) => {
  return Reflect.get(obj, key);
};
```

## Property Existence Check

```ts
// BAD - Using 'in' operator or hasOwnProperty
const hasProperty = (obj: Record<string, unknown>, key: string) => {
  return key in obj;
  // or
  return obj.hasOwnProperty(key);
};

// GOOD - Using Reflect.has
const hasProperty = (obj: Record<string, unknown>, key: string) => {
  return Reflect.has(obj, key);
};
```

## Setting Properties

```ts
// BAD - Direct assignment
const setValue = (
  obj: Record<string, unknown>,
  key: string,
  value: unknown
) => {
  obj[key] = value;
  return obj;
};

// GOOD - Using Reflect.set
const setValue = (
  obj: Record<string, unknown>,
  key: string,
  value: unknown
) => {
  Reflect.set(obj, key, value);
  return obj;
};
```

## Deleting Properties

```ts
// BAD - Using delete operator
const removeProperty = (obj: Record<string, unknown>, key: string) => {
  delete obj[key];
  return obj;
};

// GOOD - Using Reflect.deleteProperty
const removeProperty = (obj: Record<string, unknown>, key: string) => {
  Reflect.deleteProperty(obj, key);
  return obj;
};
```

## Getting Property Descriptors

```ts
// BAD - Using Object.getOwnPropertyDescriptor
const getDescriptor = (obj: Record<string, unknown>, key: string) => {
  return Object.getOwnPropertyDescriptor(obj, key);
};

// GOOD - Using Reflect.getOwnPropertyDescriptor
const getDescriptor = (obj: Record<string, unknown>, key: string) => {
  return Reflect.getOwnPropertyDescriptor(obj, key);
};
```

## When to Use Reflect

- Dynamic property access with string keys
- Building utility functions for object manipulation
- Working with Proxies
- When you need consistent error handling
- Functional programming patterns

## When Direct Access is Fine

- Static property access with known keys: `user.name`
- Simple object literals: `{ name: 'John' }`
- Type-safe property access with proper TypeScript types
