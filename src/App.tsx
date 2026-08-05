import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, AuthProvider } from './hooks'
import { router } from './routes'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="workspace-theme">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
