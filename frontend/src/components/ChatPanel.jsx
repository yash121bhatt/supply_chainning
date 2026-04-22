import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ChatPanel = ({ shipmentId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    initializeChat();
  }, [shipmentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      const data = await api.post('/chat', { shipmentId });
      setChat(data.chat);
      await fetchMessages(data.chat._id);
    } catch (error) {
      toast.error('Failed to initialize chat');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const data = await api.get(`/chat/${chatId}/messages`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat) return;

    try {
      const data = await api.post(`/chat/${chat._id}/messages`, {
        message: newMessage,
        messageType: 'text'
      });

      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoleBadge = (role) => {
    const badges = {
      shipper: 'bg-purple-100 text-purple-800',
      carrier: 'bg-blue-100 text-blue-800',
      driver: 'bg-green-100 text-green-800',
      admin: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || badges.admin;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md h-[500px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Shipment Chat</h3>
          {chat && (
            <p className="text-sm text-gray-500">Shipment: {chat.shipment?.shipmentNumber}</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender?._id === user?._id;
          return (
            <div
              key={message._id || index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-lg px-4 py-2 ${
                  isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.message}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}>
                  {!isOwn && (
                    <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadge(message.sender?.role)}`}>
                      {message.sender?.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
