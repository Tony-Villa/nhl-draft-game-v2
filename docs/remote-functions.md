# Remote Function Conventions

Remote functions are experimental in the current SvelteKit version. Migrate one component-owned
data flow at a time and keep its existing load function or endpoint until the replacement is
verified.

This project enables both `kit.experimental.remoteFunctions` and Svelte's
`compilerOptions.experimental.async`. Remote query state uses Svelte's async rendering support
during hydration, so these settings should be upgraded and tested together.

Restart the Vite dev server after changing either option. Hot reloading compiler configuration can
leave stale SSR output in the page.

## Files

- Put remote functions in `src/lib/remote/*.remote.ts`.
- A `.remote.ts` file may export only `query`, `form`, `command`, or `prerender` functions.
- Put schemas in a neighboring `*.schemas.ts` file so they can be unit tested.
- Keep database and business logic in `src/lib/server/services`; remote functions should validate,
  authorize, and delegate.

## Validation And Authentication

- Validate every remote function argument with Zod. Argument-free queries may use `query(fn)`.
- Never accept a user ID as proof of identity.
- Use `requireRemoteUser()` to read the authenticated user from `getRequestEvent().locals`.
- Use SvelteKit `error(...)` for expected authorization or not-found failures.
- Validation failures expose only the generic message configured by `handleValidationError`.

## Migration Safety

- Prefer `query` for data needed by a small number of components.
- Keep route-critical data, redirects, headers, and broad page initialization in `load`.
- Preserve a usable loading, empty, and error state in the component.
- Remove an old endpoint only after confirming it has no external consumers.
