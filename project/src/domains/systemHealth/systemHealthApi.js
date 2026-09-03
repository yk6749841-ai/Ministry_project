// System Health domain — client API.
import { request } from '../../shared/apiClient'

export const getSystemHealth = () => request('/system-health')
