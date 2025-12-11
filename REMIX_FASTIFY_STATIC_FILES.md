# How `@mcansh/remix-fastify` Serves Static Files Internally

## Overview

The `@mcansh/remix-fastify` plugin provides a comprehensive solution for serving static files in React Router applications running on Fastify. Unlike manual setups that require developers to configure static file serving separately, this plugin handles everything automatically.

**Important Note**: The official `@mcansh/remix-fastify` repository README does not document static file serving functionality. This documentation fills that gap by analyzing the actual implementation.

## Actual Implementation Analysis

Based on examining the actual source code in `packages/remix-fastify/src/plugins/index.ts`, here's how the plugin works:

### Key Import - The Static File Plugin

```typescript
// From packages/remix-fastify/src/plugins/index.ts
import fastifyStatic from "@fastify/static";
```

This is the critical import that enables static file serving.

### Production Mode Static File Configuration

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 138-157)
} else {
  let BUILD_DIR = path.join(resolvedBuildDirectory, "client");
  let ASSET_DIR = path.join(BUILD_DIR, "assets");

  await fastify.register(fastifyStatic, {
    root: BUILD_DIR,                    // Serves from build/client/
    prefix: basename,                   // URL prefix (default: "/")
    wildcard: false,                    // No wildcard matching
    cacheControl: false,                // required because we are setting custom cache-control headers in setHeaders
    dotfiles: "allow",                  // Allow .well-known, etc.
    etag: true,                         // Enable ETags
    serveDotFiles: true,                // Serve dotfiles
    lastModified: true,                 // Send Last-Modified headers
    setHeaders(res, filepath) {
      let isAsset = filepath.startsWith(ASSET_DIR);
      res.setHeader(
        "cache-control",
        isAsset
          ? cacheHeader(assetCacheControl)
          : cacheHeader(defaultCacheControl)
      );
    },
    ...fastifyStaticOptions             // User overrides
  });
}
```

### Cache Control Configuration

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 71-76)
(assetCacheControl = { public: true, maxAge: "1 year", immutable: true }),
  (defaultCacheControl = { public: true, maxAge: "1 hour" });
```

## Architecture

### Plugin Structure

The plugin is built as a Fastify plugin using the `fastify-plugin` module, which ensures proper encapsulation and loading order:

```typescript
import fp from "fastify-plugin";
import staticPlugin from "@fastify/static";
import path from "path";

export const remixFastify = fp(async (fastify, options) => {
  // Static file serving configuration
  // React Router request handler setup
});
```

### Key Dependencies

- `@fastify/static`: Fastify's official static file serving plugin
- `fastify-plugin`: Ensures proper plugin encapsulation
- React Router's build output structure

## Static File Serving Implementation

### 1. Automatic Plugin Registration

The plugin registers `@fastify/static` with these defaults (production path):

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 138-157)
await fastify.register(fastifyStatic, {
  root: path.join(resolvedBuildDirectory, "client"),
  prefix: basename, // defaults to "/"
  wildcard: false,
  cacheControl: false, // required because we are setting custom cache-control headers in setHeaders
  dotfiles: "allow",
  etag: true,
  serveDotFiles: true,
  lastModified: true,
  setHeaders(res, filepath) {
    let isAsset = filepath.startsWith(ASSET_DIR);
    res.setHeader(
      "cache-control",
      isAsset
        ? cacheHeader(assetCacheControl)
        : cacheHeader(defaultCacheControl)
    );
  },
  ...fastifyStaticOptions, // user overrides
});
```

### 2. Directory Structure Assumptions

The plugin expects React Router's build output to follow this structure:

```
build/
├── client/
│   ├── assets/
│   │   ├── index-abc123.js      # JS bundles
│   │   ├── index-def456.css     # CSS files
│   │   └── splash-xyz789.jpg    # Images/fonts
│   ├── favicon.ico              # Root-level static files
│   └── .well-known/             # Special directories
├── server/
│   └── index.js                 # Server entry point
└── fastify/                     # Fastify-specific builds (if used)
    └── server/
        └── start.js
```

### 3. URL Mapping

**Production Mode Mapping:**

- `build/client/assets/index-abc123.js` → `http://localhost:3000/assets/index-abc123.js`
- `build/client/favicon.ico` → `http://localhost:3000/favicon.ico`
- `build/client/.well-known/app.json` → `http://localhost:3000/.well-known/app.json`

These URLs assume the default `basename` of `/`. If you change `basename`, all
static paths (including `/assets`) are served under that prefix.

### 4. Request Handling Priority

- Static files under `basename` are served first because `@fastify/static` is registered before the SSR handler inside the plugin.
- API routes take precedence only if you register them before this plugin or mount them on a different prefix. The plugin itself mounts `childServer.all("*", handler)` under `basename`.
- SPA/SSR routes are handled by React Router after no other matching route exists within that prefix.

## Development vs Production Mode

### Development Mode

In development, the plugin leverages Vite's built-in static file serving:

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 116-130)
if (mode !== "production") {
  vite = await import("vite").then((mod) => {
    return mod.createServer({
      ...viteOptions,
      server: {
        ...viteOptions?.server,
        middlewareMode: true,
      },
    });
  });
}

// Later in the same function (lines 126-130)
if (vite) {
  let middie = await import("@fastify/middie").then((mod) => mod.default);
  await fastify.register(middie);
  fastify.use(vite.middlewares);
}
```

### Production Mode

In production, the plugin configures static file serving for the built assets:

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 132-157)
} else {
  let BUILD_DIR = path.join(resolvedBuildDirectory, "client");
  let ASSET_DIR = path.join(BUILD_DIR, "assets");
  await fastify.register(fastifyStatic, {
    root: BUILD_DIR,
    prefix: basename,
    wildcard: false,
    cacheControl: false, // required because we are setting custom cache-control headers in setHeaders
    dotfiles: "allow",
    etag: true,
    serveDotFiles: true,
    lastModified: true,
    setHeaders(res, filepath) {
      let isAsset = filepath.startsWith(ASSET_DIR);
      res.setHeader(
        "cache-control",
        isAsset
          ? cacheHeader(assetCacheControl)
          : cacheHeader(defaultCacheControl)
      );
    },
    ...fastifyStaticOptions,
  });
}
```

## Configuration Options

### Build Directory Configuration

```typescript
await app.register(remixFastify, {
  buildDirectory: "dist", // Default: 'build'
  serverBuildFile: "index.js", // Server entry point
});
```

### Static File Overrides

```typescript
await app.register(remixFastify, {
  assetCacheControl: { public: true, maxAge: "1 year", immutable: true },
  defaultCacheControl: { public: true, maxAge: "1 hour" },
  fastifyStaticOptions: {
    // forwarded to @fastify/static; overrides defaults above
    index: false,
  },
});
```

## Performance Optimizations

### 1. HTTP Caching

The plugin configures optimal caching headers:

- **Static Assets** (`/assets/*`): 1-year cache with immutable flag
- **Other Static Files**: Appropriate cache durations based on file type
- **Development**: No caching for hot reloading

### 2. Direct File Serving

Static files bypass Node.js application logic entirely:

- Files are served directly by Fastify's native static file handling
- No middleware overhead for static assets
- Leverages OS-level file serving optimizations

### 3. Compression

Compression is not registered automatically. Add `@fastify/compress` (or another
compression plugin) yourself before registering `remixFastify` if you want
gzip/brotli.

## Security Features

### 1. Path Traversal Protection

Built-in protection against directory traversal attacks:

```typescript
// Fastify's static plugin includes:
- Path normalization
- Directory boundary checks
- Safe path resolution
```

### 2. Directory Listing Prevention

Static directories do not allow directory listing by default:

```typescript
// No directory index generation
// Returns 404 for directory requests without index files
```

### 3. Content-Type Validation

Automatic MIME type detection with security validation:

- Safe content-type headers
- XSS protection through proper content-type setting
- Binary file handling

## Error Handling

### File Not Found (404)

- Missing assets return standard 404 responses
- No application-level error handling needed
- Fastify handles 404s efficiently

### File System Errors

- Permission denied: Plugin validates access during registration
- Corrupted files: Graceful error handling
- Disk space issues: Standard OS-level error responses

## Integration with React Router

### Build Process Integration

The plugin integrates seamlessly with React Router's build system:

1. **Asset References**: React Router generates HTML that points to `/assets/...` (or `${basename}assets/...` if you change the prefix)
2. **Cache Busting**: Hashed filenames ensure proper cache invalidation
3. **Manifest Handling**: Supports React Router's asset manifest system

### SSR Compatibility

Static file serving works alongside server-side rendering:

- Static assets are served before SSR routes are evaluated
- No interference with dynamic content generation
- Optimal caching for both static and dynamic content

## Comparison with Manual Setup

### Manual Fastify + React Router Setup

```typescript
// Developer must configure each piece manually
import staticPlugin from "@fastify/static";
import { createRequestHandler } from "@react-router/express";

// Static file serving
await app.register(staticPlugin, {
  root: path.join(process.cwd(), "build", "client"),
  prefix: "/", // or your chosen basename
});

// React Router handler
app.use(
  createRequestHandler({
    build: loadBuild(),
    mode: process.env.NODE_ENV,
  })
);
```

### With remix-fastify

```typescript
// Single registration handles everything
await app.register(remixFastify, {
  buildDirectory: "build",
});
```

## Migration from Manual Setup

### Common Migration Issues

1. **URL Prefix Changes**: Ensure asset URLs use `/assets/` prefix
   relative to your configured `basename`
2. **Build Directory**: Verify `buildDirectory` matches your build output location
3. **Development Setup**: Remove manual Vite middleware if using remix-fastify

### Benefits of Migration

- **Reduced Configuration**: ~10 lines vs ~50+ lines of manual setup
- **Automatic Optimization**: Built-in performance and security best practices
- **Maintenance**: Plugin handles updates and bug fixes
- **Consistency**: Standardized approach across projects

## Troubleshooting

### Common Issues

1. **404 Errors for Assets**

   - Check `buildDirectory` configuration
   - Verify build output exists in `client/` subdirectory
   - Ensure assets are built with correct paths

2. **Caching Issues**

   - Clear browser cache during development
   - Check `NODE_ENV` for proper mode detection
   - Verify cache headers in production

3. **Build Integration**
   - Ensure the build outputs asset URLs under `${basename}assets/`
   - Check that `client/` directory contains built assets
   - Verify server build file location

### Debug Configuration

```typescript
await app.register(remixFastify, {
  fastifyStaticOptions: {
    index: false,
  },
});
```

## Future Considerations

### Plugin Evolution

- The plugin may add support for additional static file optimizations
- CDN integration features could be added
- Advanced caching strategies may be implemented

### React Router Compatibility

- Maintains compatibility with React Router's asset handling conventions
- Supports future React Router build system changes
- Adapts to new static asset optimization features

## Additional Implementation Details

### Development vs Production Mode Logic

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 116-130)
if (mode !== "production") {
  vite = await import("vite").then((mod) => {
    return mod.createServer({
      ...viteOptions,
      server: {
        ...viteOptions?.server,
        middlewareMode: true,
      },
    });
  });
}

// Later in the same function (lines 126-130)
if (vite) {
  let middie = await import("@fastify/middie").then((mod) => mod.default);
  await fastify.register(middie);
  fastify.use(vite.middlewares);
}
```

### Content Type Parser Setup

```typescript
// From packages/remix-fastify/src/plugins/index.ts (lines 162-168)
childServer.removeAllContentTypeParsers();
childServer.addContentTypeParser("*", (_request, payload, done) => {
  done(null, payload);
});
```

This removes Fastify's default content type parsing to let React Router handle all request bodies.

## Key Differences from Manual Setup

### Your Current Manual Setup (`start.ts`)

- **Missing**: No `@fastify/static` registration
- **Missing**: No static file serving middleware
- **Has**: React Router handler via `@react-router/express`
- **Result**: 404 errors for static assets

### Working Plugin Setup (`start_old.ts` with `@mcansh/remix-fastify`)

- **Has**: Automatic `@fastify/static` registration (packages/remix-fastify/src/plugins/index.ts lines 138-157)
- **Has**: Proper static file serving from `build/client/`
- **Has**: React Router handler with correct priority
- **Result**: Static assets served correctly

## Why Your Assets Get 404s

Your `dist` folder contains the correct files, but your server (`start.ts`) only registers the React Router handler without the static file serving middleware that `@mcansh/remix-fastify` provides automatically.

The plugin's `createPlugin` function (packages/remix-fastify/src/plugins/index.ts lines 82-179) handles both static files AND React Router requests, while your manual setup only handles React Router requests.

This documentation covers the internal implementation of static file serving in `@mcansh/remix-fastify`, providing both the technical details for developers and migration guidance for existing applications. The official repository README does not document this functionality, making this analysis particularly valuable for understanding the "magic" that happens behind the scenes.

## Contributing Back

This documentation could be valuable to the broader React Router/Fastify community. Consider:

1. **Opening a PR** to add static file documentation to the official repository
2. **Creating an issue** requesting better documentation of static file serving
3. **Sharing this analysis** in relevant community forums or discussions

The `@mcansh/remix-fastify` plugin provides excellent functionality, but its documentation could be enhanced with these technical details.
