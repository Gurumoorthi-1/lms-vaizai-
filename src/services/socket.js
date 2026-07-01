import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (!token) {
    console.warn('[Socket] No token provided, cannot initialize');
    return null;
  }

  if (socket) {
    if (socket.connected) {
      console.log('[Socket] Already connected');
      return socket;
    }
    socket.disconnect();
    socket = null;
  }

  console.log('[Socket] Initializing with token:', !!token);

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected successfully');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected manually');
  }
};
