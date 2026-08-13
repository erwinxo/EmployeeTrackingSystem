import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
import { APP_CONFIG, STORAGE_KEYS } from '../constants'

// Create configured Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Inject Auth Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Global Error & Unauth Handler
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        // Clear local credentials on unauthenticated access
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        
        // Broadcast auth error event for reactive state reset
        window.dispatchEvent(new Event('auth:unauthorized'))
      } else if (status === 403) {
        console.error('Access Denied: You do not have permission for this resource.')
      } else if (status >= 500) {
        console.error('Server Error: Something went wrong on the server.')
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server.')
    }

    return Promise.reject(error)
  }
)

export default api
