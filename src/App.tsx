import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, AuthProvider, SocketProvider } from './hooks'
import { router } from './routes'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="workspace-theme">
      <AuthProvider>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
