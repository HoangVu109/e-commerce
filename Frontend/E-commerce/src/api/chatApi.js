import { privateClient } from './axiosInstance.js'

const chatApi = {
  getMySessions: () => privateClient.get('/chat/sessions'),
  getAllSessions: (status) => privateClient.get('/chat/sessions', { params: status ? { status } : {} }),
  getMessages: (sessionId) => privateClient.get(`/chat/sessions/${sessionId}/messages`),
  closeSession: (sessionId) => privateClient.patch(`/chat/sessions/${sessionId}/close`),
}

export default chatApi
