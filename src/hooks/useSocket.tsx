import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { STORAGE_KEYS } from '../constants';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: [], isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const getSocketUrl = () => {
    const apiUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      'https://employeetrackingsystem-ymsp.onrender.com/api/v1';
    return apiUrl.replace('/api/v1', '');
  };

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const socketUrl = getSocketUrl();
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Global presence socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Global presence socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('online_users_list', (onlineIds: string[]) => {
      setOnlineUsers(onlineIds);
    });

    socketInstance.on('presence_change', (payload: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers((prev) => {
        if (payload.status === 'online') {
          if (prev.includes(payload.userId)) return prev;
          return [...prev, payload.userId];
        } else {
          return prev.filter((id) => id !== payload.userId);
        }
      });
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
