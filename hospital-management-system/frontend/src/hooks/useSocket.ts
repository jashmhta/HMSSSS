import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the backend socket server
    socketRef.current = io(process.env['NEXT_PUBLIC_BACKEND_URL'] || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emit = (event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return { socket: socketRef.current, emit, on, off };
};

export default useSocket;