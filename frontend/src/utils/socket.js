import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BASE_URL || 'http://localhost:1111';

export const socket = io(URL, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true // connects as soon as the app loads
});