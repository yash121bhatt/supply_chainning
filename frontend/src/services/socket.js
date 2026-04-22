import { io } from 'socket.io-client';
import useAuthStore from '../context/AuthContext';
import { toast } from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) return;

    const { user } = useAuthStore.getState();
    if (!user) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
      this.socket.emit('joinUserRoom', user._id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('newNotification', (notification) => {
      toast(notification.message, {
        icon: '🔔',
        duration: 5000
      });
    });

    this.socket.on('shipmentStatusChanged', (data) => {
      toast(`Shipment status updated to ${data.status}`, {
        icon: '🚚',
        duration: 4000
      });
      window.dispatchEvent(new window.CustomEvent('shipmentStatusUpdate', { detail: data }));
    });

    this.socket.on('shipmentLocationUpdated', (data) => {
      window.dispatchEvent(new window.CustomEvent('shipmentLocationUpdate', { detail: data }));
    });

    this.socket.on('newBidReceived', (data) => {
      toast(`New bid of ₹${data.amount} received!`, {
        icon: '💰',
        duration: 5000
      });
    });

    this.socket.on('bidStatusUpdated', (data) => {
      toast(`Your bid has been ${data.status}`, {
        icon: data.status === 'accepted' ? '✅' : '❌',
        duration: 5000
      });
    });

    this.socket.on('paymentNotification', (data) => {
      toast(data.message, {
        icon: '💳',
        duration: 5000
      });
    });

    this.socket.on('newShipmentAvailable', (data) => {
      window.dispatchEvent(new window.CustomEvent('newShipmentAvailable', { detail: data }));
    });

    this.socket.on('newMessage', (message) => {
      window.dispatchEvent(new window.CustomEvent('newChatMessage', { detail: message }));
    });

    this.socket.on('userTyping', ({ userId }) => {
      window.dispatchEvent(new window.CustomEvent('userTyping', { detail: { userId } }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('joinRoom', room);
    }
  }

  leaveRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('leaveRoom', room);
    }
  }

  sendTyping(chatId) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatId, userId: useAuthStore.getState().user?._id });
    }
  }

  sendStopTyping(chatId) {
    if (this.socket?.connected) {
      this.socket.emit('stopTyping', { chatId });
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

const socketService = new SocketService();

export default socketService;
