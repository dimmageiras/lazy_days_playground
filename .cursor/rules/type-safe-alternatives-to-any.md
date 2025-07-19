When building generic functions, you should avoid using `any` even inside the function body.

While TypeScript often cannot match your runtime logic to the logic done inside your types, there are several type-safe alternatives to using `any`.

## The Problem

One example where developers might be tempted to use `any`:

```ts
const youSayGoodbyeISayHello = <TInput extends "hello" | "goodbye">(
  input: TInput
): TInput extends "hello" ? "goodbye" : "hello" => {
  if (input === "goodbye") {
    return "hello"; // Error!
  } else {
    return "goodbye"; // Error!
  }
};
```

On the type level (and the runtime), this function returns `goodbye` when the input is `hello`.

## Type-Safe Solutions

### Solution 1: Function Overloads

The most type-safe approach is to use function overloads:

```ts
function youSayGoodbyeISayHello(input: "hello"): "goodbye";
function youSayGoodbyeISayHello(input: "goodbye"): "hello";
function youSayGoodbyeISayHello(
  input: "hello" | "goodbye"
): "hello" | "goodbye" {
  if (input === "goodbye") {
    return "hello";
  } else {
    return "goodbye";
  }
}
```

### Solution 2: Assertion with Unknown

If you must use type assertions, use `unknown` instead of `any`:

```ts
const youSayGoodbyeISayHello = <TInput extends "hello" | "goodbye">(
  input: TInput
): TInput extends "hello" ? "goodbye" : "hello" => {
  if (input === "goodbye") {
    return "hello" as unknown as TInput extends "hello" ? "goodbye" : "hello";
  } else {
    return "goodbye" as unknown as TInput extends "hello" ? "goodbye" : "hello";
  }
};
```

### Solution 3: Lookup Types (Recommended)

The cleanest approach uses a lookup type:

```ts
type OppositeMap = {
  hello: "goodbye";
  goodbye: "hello";
};

const youSayGoodbyeISayHello = <TInput extends keyof OppositeMap>(
  input: TInput
): OppositeMap[TInput] => {
  const opposites: OppositeMap = {
    hello: "goodbye",
    goodbye: "hello",
  };

  return opposites[input];
};
```

### Solution 4: Conditional Type Helper

For more complex scenarios, create a helper type:

```ts
type Opposite<T> = T extends "hello"
  ? "goodbye"
  : T extends "goodbye"
    ? "hello"
    : never;

const oppositeMap = {
  hello: "goodbye",
  goodbye: "hello",
} as const;

const youSayGoodbyeISayHello = <TInput extends keyof typeof oppositeMap>(
  input: TInput
): Opposite<TInput> => {
  return oppositeMap[input] as Opposite<TInput>;
};
```

## Best Practices

1. **Prefer function overloads** for simple cases with known input/output pairs
2. **Use lookup types** for mapping-style functions
3. **Create helper types** for complex conditional logic
4. **Avoid `any`** completely - use `unknown` if type assertion is absolutely necessary
5. **Consider refactoring** the function design if type assertions are frequently needed

These approaches maintain full type safety while avoiding the use of `any`, ensuring your code passes strict linting rules and provides better development experience.
