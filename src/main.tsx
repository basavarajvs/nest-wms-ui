import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'
import { DirectionProvider } from './context/direction-provider'
import { FacilityProvider } from './context/FacilityContext'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { useAuth } from './hooks/useAuth'
import { ErrorBoundary } from '@/components/error-boundary'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// Create a new router instance
export const router = createRouter({
  routeTree,
  context: { queryClient, auth: undefined! },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ queryClient, auth }} />
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FacilityProvider>
            <ThemeProvider>
              <FontProvider>
                <DirectionProvider>
                  <TooltipProvider>
                    <ErrorBoundary>
                      <InnerApp />
                    </ErrorBoundary>
                  </TooltipProvider>
                </DirectionProvider>
              </FontProvider>
            </ThemeProvider>
          </FacilityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
