import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

export function errorMessage(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: Record<string, string[]> } | undefined
    const first = data?.details && Object.values(data.details).flat()[0]
    return first ?? data?.error ?? (err.code === 'ERR_NETWORK' ? 'Cannot reach server' : fallback)
  }
  return fallback
}
