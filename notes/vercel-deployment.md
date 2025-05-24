# Vercel Deployment Configuration for Monorepo Setup

This file documents the configuration required to successfully deploy a Next.js application from a monorepo structure to Vercel, including local package dependencies.

## Problem

When deploying a Next.js application to Vercel that depends on local packages (e.g., using `link:` references in package.json), the build fails with:

```
Failed to compile.
./components/demo/sdk-context.tsx
Module not found: Can't resolve '@toolpay/provider-sdk'
https://nextjs.org/docs/messages/module-not-found
```

This occurs because Vercel's build system doesn't support local package links out of the box and requires specific configuration for monorepos.

## Solution: Monorepo Configuration

The following files were created or modified to enable proper deployment:

### 1. Root package.json

Created a root `package.json` that defines workspaces:

```json
{
  "name": "toolpay",
  "private": true,
  "version": "0.0.0",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "dev:web": "pnpm --filter httpay-website dev",
    "build:web": "pnpm --filter httpay-website build"
  }
}
```

### 2. pnpm-workspace.yaml

Created a `pnpm-workspace.yaml` file:

```yaml
packages:
  - 'packages/*'
```

### 3. vercel.json

Created a `vercel.json` file to configure the build process:

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "outputDirectory": "packages/httpay-website/.next"
}
```

### 4. httpay-website package.json

Updated the local package reference from:

```json
"@toolpay/provider-sdk": "link:../provider-sdk"
```

to:

```json
"@toolpay/provider-sdk": "workspace:*"
```

### 5. .npmrc

Created an `.npmrc` file in the `httpay-website` directory:

```
shamefully-hoist=true
node-linker=hoisted
```

## Deployment Process

After making these changes, the deployment process is as follows:

1. Push changes to the repository
2. Connect the repository to Vercel
3. Ensure that the project's "Root Directory" is set correctly (the repository root, not the website folder)
4. Vercel will automatically detect the monorepo structure and build according to the settings in vercel.json

## Notes

- The `workspace:*` syntax is specific to pnpm and tells it to use the version from the workspace
- The `.npmrc` configuration ensures proper hoisting of dependencies
- The `vercel.json` file specifically points to the Next.js output directory within the workspace

This configuration allows Vercel to properly resolve and include the local package during the build process, ensuring that imports like `@toolpay/provider-sdk` work correctly.
