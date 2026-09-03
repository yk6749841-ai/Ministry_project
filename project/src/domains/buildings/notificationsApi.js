// Notification-server client API. The notification server backs the return-home
// package flow, which the Buildings domain owns.
import { request } from '../../shared/apiClient'

export const listNotifications = () => request('/notifications')

export const getNotificationMode = () => request('/notifications/mode')

export const setNotificationMode = (mode) =>
  request('/notifications/mode', { method: 'POST', body: JSON.stringify({ mode }) })
