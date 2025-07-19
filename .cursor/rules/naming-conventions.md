- Use kebab-case for type declaration file names (e.g., `my-declaration.d.ts`)
- Use kebab-case for helper file names (e.g., `my-functions.helper.ts`)
- Use kebab-case for test file names (e.g., `my-functions.test.ts`)
- Use UpperCamelCase for React Functional Component file names (e.g., `MyComponent.tsx`)
- Use UpperCamelCase for React Functional Component variable names (e.g., `MyComponent`)
- Use camelCase for variables and function names (e.g., `myVariable`, `myFunction()`)
- Use UpperCamelCase (PascalCase) for classes, types, and interfaces (e.g., `MyClass`, `MyInterface`)
- Use ALL_CAPS for constants and enum values (e.g., `MAX_COUNT`, `Color.RED`)
- Inside generic types, functions or classes, prefix type parameters with `T` (e.g., `TKey`, `TValue`)

```ts
type RecordOfArrays<TItem> = Record<string, TItem[]>;
```
