import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://localhost:7270/api').replace(/\/api$/, '')
const HUB_URL = `${BASE_URL}/hubs/chat`

export function useChatConnection(user) {
  const connectionRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const handlersRef = useRef({ onMessage: null, onSessionClosed: null, onSessionUpdated: null, onNewSession: null, onError: null })
  const isConnectingRef = useRef(false)

  const setHandlers = useCallback((handlers) => {
    handlersRef.current = { ...handlersRef.current, ...handlers }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !user) {
      // Không có token hoặc user → ngắt kết nối cũ nếu có
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Tránh tạo connection trùng lặp
    if (isConnectingRef.current) return
    isConnectingRef.current = true

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem('token') ?? '' })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (msg) => {
      handlersRef.current.onMessage?.(msg)
    })

    connection.on('SessionClosed', (data) => {
      handlersRef.current.onSessionClosed?.(data)
    })

    connection.on('SessionUpdated', (data) => {
      handlersRef.current.onSessionUpdated?.(data)
    })

    connection.on('NewSession', (data) => {
      handlersRef.current.onNewSession?.(data)
    })

    connection.on('Error', (msg) => {
      handlersRef.current.onError?.(msg)
    })

    connection.onreconnecting(() => setIsConnected(false))
    connection.onreconnected(() => setIsConnected(true))
    connection.onclose(() => {
      setIsConnected(false)
      isConnectingRef.current = false
    })

    connection.start()
      .then(() => {
        setIsConnected(true)
        isConnectingRef.current = false
      })
      .catch((err) => {
        console.error('SignalR connection failed:', err)
        isConnectingRef.current = false
      })

    connectionRef.current = connection

    return () => {
      isConnectingRef.current = false
      connection.stop()
    }
  }, [user])

  const joinSession = useCallback((sessionId) => {
    connectionRef.current?.invoke('JoinSession', sessionId).catch(() => {})
  }, [])

  const leaveSession = useCallback((sessionId) => {
    connectionRef.current?.invoke('LeaveSession', sessionId).catch(() => {})
  }, [])

  const sendMessage = useCallback((dto) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR not connected, cannot send message')
      return Promise.reject(new Error('Chưa kết nối đến máy chủ chat'))
    }
    return connectionRef.current.invoke('SendMessage', dto)
  }, [])

  const closeSession = useCallback((sessionId) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR not connected, cannot close session')
      return Promise.reject(new Error('Chưa kết nối đến máy chủ chat'))
    }
    return connectionRef.current.invoke('CloseSession', sessionId)
  }, [])

  const markRead = useCallback((sessionId) => {
    connectionRef.current?.invoke('MarkRead', sessionId).catch(() => {})
  }, [])

  return { connection: connectionRef.current, isConnected, joinSession, leaveSession, sendMessage, closeSession, markRead, setHandlers }
}
