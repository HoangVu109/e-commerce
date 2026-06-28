import { useState, useEffect, useRef, useCallback } from 'react'
import { Input, Button, Badge, Empty, Spin, Modal, Select, message } from 'antd'
import { SendOutlined, CheckOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import chatApi from '../../api/chatApi'
import { useChatConnection } from '../../hooks/useChatConnection'

const STATUS_FILTER = [
  { value: '', label: 'Tất cả' },
  { value: 'Open', label: 'Đang mở' },
  { value: 'Closed', label: 'Đã đóng' },
]

export default function StaffChatPage() {
  const { user } = useAuth()
  const { joinSession, leaveSession, sendMessage: sendSignalR, closeSession: closeSignalR, markRead, setHandlers, isConnected } = useChatConnection(user)

  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef(null)
  const activeSessionRef = useRef(null)

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await chatApi.getAllSessions(filter || undefined)
      setSessions(res.data ?? [])
    } catch {
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [filter])

  useEffect(() => { loadSessions() }, [loadSessions])

  // SignalR handlers
  useEffect(() => {
    setHandlers({
      onMessage: (msg) => {
        if (activeSessionRef.current?.id === msg.sessionId) {
          setMessages((prev) => [...prev, msg])
        }
        loadSessions()
      },
      onSessionClosed: (data) => {
        setSessions((prev) =>
          prev.map((s) => (s.id === data.sessionId ? { ...s, status: 'Closed' } : s))
        )
        if (activeSessionRef.current?.id === data.sessionId) {
          setActiveSession((prev) => prev ? { ...prev, status: 'Closed' } : null)
        }
        loadSessions()
      },
      onSessionUpdated: () => loadSessions(),
      onNewSession: () => loadSessions(),
      onError: (msg) => message.error(msg),
    })
  }, [setHandlers, loadSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectSession = async (session) => {
    if (activeSessionRef.current) {
      leaveSession(activeSessionRef.current.id)
    }
    setActiveSession(session)
    activeSessionRef.current = session
    joinSession(session.id)
    await markRead(session.id)
    await loadSessions()  // refresh unread badges

    setLoadingMessages(true)
    try {
      const res = await chatApi.getMessages(session.id)
      setMessages(res.data ?? [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || !activeSession) return
    if (activeSession.status === 'Closed') {
      message.warning('Session đã đóng, không thể gửi tin nhắn.')
      return
    }
    setSending(true)
    try {
      await sendSignalR({ sessionId: activeSession.id, content: text })
      setInput('')
    } catch {
      message.error('Gửi tin nhắn thất bại.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCloseSession = () => {
    if (!activeSession) return
    Modal.confirm({
      title: 'Đóng session',
      content: 'Bạn có chắc muốn đóng session hỗ trợ này?',
      okText: 'Đóng',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await closeSignalR(activeSession.id)
          message.success('Đã đóng session.')
          await loadSessions()
        } catch {
          message.error('Đóng session thất bại.')
        }
      },
    })
  }

  const formatTime = (dt) => {
    const d = new Date(dt)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Left: Session list */}
      <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 mb-2">Tin nhắn</h2>
          <Select
            value={filter}
            onChange={setFilter}
            options={STATUS_FILTER}
            className="w-full"
            size="small"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Spin spinning={loadingSessions}>
            {sessions.length === 0 ? (
              <Empty description="Không có session nào" className="py-12" />
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    activeSession?.id === s.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.customerName || `KH ${s.customerId.slice(0, 6)}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {s.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {s.lastMessageAt ? formatTime(s.lastMessageAt) : formatTime(s.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        {s.status === 'Closed' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">Đã đóng</span>
                        )}
                        {s.unreadCount > 0 && (
                          <Badge count={s.unreadCount} size="small" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </Spin>
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <Empty description="Chọn một session để bắt đầu chat" />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <div>
                <p className="font-semibold text-gray-800">
                  {activeSession.customerName || `KH ${activeSession.customerId.slice(0, 6)}`}
                </p>
                <p className="text-xs text-gray-500">
                  {activeSession.status === 'Closed' ? '🔒 Đã đóng' : '🟢 Đang mở'}
                  {isConnected ? ' • Online' : ' • Đang kết nối...'}
                </p>
              </div>
              {activeSession.status !== 'Closed' && (
                <Button
                  danger
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleCloseSession}
                >
                  Đóng session
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              <Spin spinning={loadingMessages}>
                {messages.map((msg) => {
                  const isMine = user?.userId && msg.senderId.toLowerCase() === user.userId.toLowerCase()
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <p className="text-[10px] text-gray-500 mb-0.5 ml-1">
                            {msg.senderName || 'Khách hàng'}
                          </p>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {formatTime(msg.sentAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </Spin>
            </div>

            {/* Input */}
            {activeSession.status !== 'Closed' ? (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  className="flex-1"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!input.trim()}
                  shape="circle"
                />
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500 flex-shrink-0">
                🔒 Session này đã được đóng
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
