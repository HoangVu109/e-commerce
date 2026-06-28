import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useChatConnection } from '../hooks/useChatConnection'
import chatApi from '../api/chatApi'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user } = useAuth()
  const { joinSession, leaveSession, sendMessage: sendSignalR, closeSession: closeSignalR, markRead, setHandlers, isConnected } = useChatConnection(user)

  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [isNewChat, setIsNewChat] = useState(false)
  const [messages, setMessages] = useState({})
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const activeSessionRef = useRef(null)
  activeSessionRef.current = activeSessionId

  const isNewChatRef = useRef(false)
  isNewChatRef.current = isNewChat

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!user) return
    setLoadingSessions(true)
    try {
      const res = await chatApi.getMySessions()
      const list = res.data ?? []
      setSessions(list)
      // Chỉ đếm unread từ các session KHÔNG phải session đang mở
      const total = list.reduce((sum, s) => {
        if (s.id === activeSessionRef.current) return sum
        return sum + (s.unreadCount || 0)
      }, 0)
      setUnreadTotal(total)
    } catch {
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [user])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Register SignalR handlers
  useEffect(() => {
    setHandlers({
      onMessage: (msg) => {
        setMessages((prev) => {
          const sessionMsgs = [...(prev[msg.sessionId] || []), msg]
          return { ...prev, [msg.sessionId]: sessionMsgs }
        })
        // Nếu đang ở chế độ new chat, tự động chuyển sang session mới
        if (isNewChatRef.current && msg.sessionId) {
          setIsNewChat(false)
          setActiveSessionId(msg.sessionId)
          joinSession(msg.sessionId)
        }
        loadSessions()
      },
      onSessionClosed: (data) => {
        setSessions((prev) =>
          prev.map((s) => (s.id === data.sessionId ? { ...s, status: 'Closed' } : s))
        )
      },
      onSessionUpdated: () => {
        loadSessions()
      },
      onError: (msg) => {
        console.warn('Chat error:', msg)
      },
    })
  }, [setHandlers, loadSessions, joinSession])

  // Load messages when active session changes
  const openSession = useCallback(async (sessionId) => {
    if (activeSessionRef.current) {
      leaveSession(activeSessionRef.current)
    }
    setActiveSessionId(sessionId)
    joinSession(sessionId)
    await markRead(sessionId)
    await loadSessions()  // refresh unread counts

    setLoadingMessages(true)
    try {
      const res = await chatApi.getMessages(sessionId)
      const list = res.data ?? []
      setMessages((prev) => ({ ...prev, [sessionId]: list }))
    } catch {
      setMessages((prev) => ({ ...prev, [sessionId]: [] }))
    } finally {
      setLoadingMessages(false)
    }
  }, [joinSession, leaveSession, markRead, loadSessions])

  const closeActiveSession = useCallback(async () => {
    if (activeSessionRef.current) {
      leaveSession(activeSessionRef.current)
    }
    setActiveSessionId(null)
    setIsNewChat(false)
  }, [leaveSession])

  const startNewChat = useCallback(() => {
    if (activeSessionRef.current) {
      leaveSession(activeSessionRef.current)
    }
    setActiveSessionId(null)
    setIsNewChat(true)
  }, [leaveSession])

  const sendMessage = useCallback(async (content) => {
    const sessionId = isNewChatRef.current ? null : activeSessionRef.current
    const dto = { sessionId, content }
    await sendSignalR(dto)
  }, [sendSignalR])

  const closeCurrentSession = useCallback(async () => {
    const sessionId = activeSessionRef.current
    if (!sessionId) return
    await closeSignalR(sessionId)
    await loadSessions()
  }, [closeSignalR, loadSessions])

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        isNewChat,
        messages,
        unreadTotal,
        loadingSessions,
        loadingMessages,
        isConnected,
        loadSessions,
        openSession,
        closeActiveSession,
        startNewChat,
        sendMessage,
        closeCurrentSession,
        setActiveSessionId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)
