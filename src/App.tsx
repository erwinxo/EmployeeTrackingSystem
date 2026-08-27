import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, AuthProvider, SocketProvider, SystemSettingsProvider } from './hooks'
import { router } from './routes'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="workspace-theme">
      <AuthProvider>
        <SocketProvider>
          <SystemSettingsProvider>
            <RouterProvider router={router} />
          </SystemSettingsProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
