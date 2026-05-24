# Prompt 01 — Project Setup & Configuration

## Task

Initialize the `nest-saas-ui` frontend project by cloning the shadcn-admin template and integrating the generated API client from the WMS SaaS Core backend.

## Steps

### 1. Clone shadcn-admin as foundation

```bash
cd /home/raju/Project/Nest/SaasCore
git clone https://github.com/satnaing/shadcn-admin.git nest-saas-ui
cd nest-saas-ui
pnpm install
```

### 2. Set up environment

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=nest-saas-ui
```

Update `.env.example` with the same variables.

### 3. Configure path aliases

Ensure `tsconfig.app.json` has path alias `@/*` mapped to `./src/*`. If not present, add:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### 4. Copy the generated API client

Copy the entire `generated-client/lib` directory from `wms-saas-core` into the frontend project:

```bash
cp -r ../wms-saas-core/generated-client/lib ./src/lib
```

This gives you:
- `src/lib/http/httpClient.ts` — Axios instance with auto auth headers
- `src/lib/queryClient.ts` — TanStack Query configuration
- `src/lib/api/wms-saas-core-api/*.ts` — 26 endpoint modules with React Query hooks
- `src/lib/types/wms-saas-core-api/*.ts` — TypeScript types

### 5. Configure Vite to resolve the @/ alias

Check `vite.config.ts` already has the alias. If not, add `resolve.alias`:
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ...
})
```

### 6. Verify the setup works

Run the dev server:
```bash
pnpm run dev
```

The app should load at `http://localhost:5173` with the default shadcn-admin dashboard.

Make sure the existing shadcn-admin app renders (it has a sample dashboard with dummy data).

### 7. Clean up default pages

Remove the demo pages that come with shadcn-admin that we won't use:
- Any dummy tasks/sample pages (keep the layout, sidebar, header, theme toggle)

Do NOT remove:
- `src/components/ui/` — all shadcn components
- `src/components/common/` — any reusable components
- Layout/Sidebar/Header components
- Dark mode toggle infrastructure

### 8. Verify

```bash
pnpm run dev
# Should still render with basic shell
```

## Verification Checklist

- [ ] `pnpm run dev` starts without errors
- [ ] `src/lib/http/httpClient.ts` exists
- [ ] `src/lib/queryClient.ts` exists
- [ ] `src/lib/api/wms-saas-core-api/` has 26 subdirectories
- [ ] `src/lib/types/wms-saas-core-api/` has 118+ type files
- [ ] Path alias `@/lib/...` resolves correctly
- [ ] App renders at localhost:5173
