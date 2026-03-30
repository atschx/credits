import axios, { type AxiosRequestConfig } from 'axios'

interface ApiBody<T = unknown> {
  success: boolean
  message: string | null
  data: T
}

const instance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiBody
    if (body.success) {
      return body.data as never
    }
    return Promise.reject(new Error(body.message || 'Request failed'))
  },
  (error) => {
    const msg = error.response?.data?.message || error.message
    return Promise.reject(new Error(msg))
  },
)

const api = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config) as Promise<T>
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config) as Promise<T>
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config) as Promise<T>
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config) as Promise<T>
  },
}

export default api
