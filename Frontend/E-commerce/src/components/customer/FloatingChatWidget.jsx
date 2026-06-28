import { useState } from 'react'
import { Badge } from 'antd'
import { MessageOutlined, CloseOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import ChatWindow from './ChatWindow'

export default function FloatingChatWidget() {
  const { user } = useAuth()
  const { unreadTotal, isConnected } = useChat()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Nút chat */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500'
        }`}
        title={isConnected ? 'Chat hỗ trợ' : 'Đang kết nối...'}
      >
        <Badge count={unreadTotal} size="small" offset={[-4, 4]}>
          {open ? (
            <CloseOutlined className="text-xl" />
          ) : (
            <MessageOutlined className="text-2xl" />
          )}
        </Badge>
      </button>

      {/* Popup chat window */}
      <div
        className={`fixed bottom-24 right-6 z-50 transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <ChatWindow onClose={() => setOpen(false)} />
      </div>
    </>
  )
}
