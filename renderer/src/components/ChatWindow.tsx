import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface ChatWindowProps {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ deviceId, deviceName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load message history
    window.electronAPI.getMessages(deviceId).then(setMessages);

    // Listen for incoming messages
    const unsubscribe = window.electronAPI.onMessage((msg: Message) => {
      if (msg.senderId === deviceId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return unsubscribe;
  }, [deviceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: inputText,
      timestamp: Date.now(),
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setInputText('');

    try {
      await window.electronAPI.sendMessage(deviceId, inputText);
      setMessages(prev =>
        prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m)
      );
    } catch (error) {
      setMessages(prev =>
        prev.map(m => m.id === message.id ? { ...m, status: 'failed' } : m)
      );
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{deviceName}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>{deviceId}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: msg.senderId === 'me' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '8px 12px',
              borderRadius: '12px',
              background: msg.senderId === 'me' ? '#1976d2' : 'white',
              color: msg.senderId === 'me' ? 'white' : 'black',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <div>{msg.content}</div>
              <div style={{
                fontSize: '10px',
                marginTop: '4px',
                opacity: 0.7,
                textAlign: 'right'
              }}>
                {formatTime(msg.timestamp)}
                {msg.senderId === 'me' && (
                  <span style={{ marginLeft: '4px' }}>
                    {msg.status === 'sending' ? '⏱' : msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : '⚠'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        background: 'white',
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Mesaj yaz..."
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '24px',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            padding: '12px 24px',
            background: inputText.trim() ? '#1976d2' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          Gönder
        </button>
      </div>
    </div>
  );
};
