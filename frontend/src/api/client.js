import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body.success) {
      return body.data
    }
    return Promise.reject(new Error(body.message || 'Request failed'))
  },
  (error) => {
    const msg = error.response?.data?.message || error.message
    return Promise.reject(new Error(msg))
  }
)

export default api
