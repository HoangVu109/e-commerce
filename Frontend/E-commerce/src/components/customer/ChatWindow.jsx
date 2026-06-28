import { useState, useRef, useEffect } from 'react'
import { Input, Button, Badge, Empty, Spin, message } from 'antd'
import { PlusOutlined, SendOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'

export default function ChatWindow({ onClose }) {
  const { user } = useAuth()
  const {
    sessions, activeSessionId, isNewChat, messages, loadingSessions, loadingMessages,
    openSession, startNewChat, closeActiveSession, sendMessage, loadSessions,
  } = useChat()

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const activeMessages = activeSessionId ? (messages[activeSessionId] || []) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await sendMessage(text)
      setInput('')
      await loadSessions()
    } catch (err) {
      console.error('Send message failed:', err)
      message.error(err?.message || 'Gửi tin nhắn thất bại, thử lại sau.')
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

  const handleStartNew = () => {
    startNewChat()
  }

  const handleSelectSession = (session) => {
    if (session.status === 'Closed') {
      openSession(session.id)
    } else {
      openSession(session.id)
    }
  }

  const formatTime = (dt) => {
    const d = new Date(dt)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dt) => {
    const d = new Date(dt)
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          {(activeSessionId || (isNewChat && !activeSessionId)) && (
            <button
              onClick={closeActiveSession}
              className="w-6 h-6 rounded-full hover:bg-blue-500 flex items-center justify-center transition-colors text-sm mr-1"
              title="Quay lại danh sách"
            >
              ←
            </button>
          )}
          <span className="text-lg">💬</span>
          <span className="font-semibold text-sm">
            {isNewChat && !activeSessionId ? 'Chat mới' : activeSessionId ? 'Chat hỗ trợ' : 'Chat hỗ trợ'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isNewChat && (
            <button
              onClick={handleStartNew}
              className="w-8 h-8 rounded-full hover:bg-blue-500 flex items-center justify-center transition-colors"
              title="Tạo đoạn chat mới"
            >
              <PlusOutlined />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-blue-500 flex items-center justify-center transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isNewChat && !activeSessionId ? (
          /* New Chat Mode - show input directly */
          <>
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-gray-400 text-sm text-center">
                Nhập tin nhắn bên dưới để bắt đầu cuộc trò chuyện mới với nhân viên hỗ trợ
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white flex-shrink-0">
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
          </>
        ) : !activeSessionId ? (
          /* Session List */
          <div className="flex-1 overflow-y-auto">
            <Spin spinning={loadingSessions}>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Empty description="Chưa có cuộc trò chuyện nào" />
                  <Button type="primary" onClick={handleStartNew} className="mt-3">
                    Bắt đầu chat mới
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  <p className="text-xs text-gray-500 px-2 py-1">Cuộc trò chuyện</p>
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 mb-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {s.status === 'Closed' && '🔒 '}Hỗ trợ #{s.id.slice(0, 6)}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {s.lastMessage || 'Chưa có tin nhắn'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {s.lastMessageAt ? formatDate(s.lastMessageAt) : formatDate(s.createdAt)}
                          </span>
                          {s.unreadCount > 0 && (
                            <Badge count={s.unreadCount} size="small" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Spin>
          </div>
        ) : (
          /* Chat Messages */
          <>
            {/* Session info bar */}
            {activeSession?.status === 'Closed' && (
              <div className="px-4 py-2 bg-gray-100 text-center text-xs text-gray-500 border-b border-gray-200">
                🔒 Cuộc trò chuyện này đã kết thúc
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <Spin spinning={loadingMessages}>
                {activeMessages.length === 0 && !loadingMessages && (
                  <p className="text-center text-gray-400 text-xs py-8">
                    Gửi tin nhắn đầu tiên để bắt đầu
                  </p>
                )}
                {activeMessages.map((msg) => {
                  const isMine = user?.userId && msg.senderId.toLowerCase() === user.userId.toLowerCase()
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatTime(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </Spin>
            </div>

            {/* Input */}
            {activeSession?.status !== 'Closed' && (
              <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white flex-shrink-0">
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
            )}
          </>
        )}
      </div>
    </div>
  )
}
