import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMessageHistory } from '../services/api';
import { createStompClient, sendStompMessage } from '../services/websocket';

export default function Chat() {
  const { token, username, logout } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleWsMessage = useCallback((body) => {
    const dto = body.payload || body;
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m.id && m.id === dto.id);
      if (isDuplicate) return prev;
      return [...prev, dto];
    });
  }, []);

  const connectWs = useCallback(() => {
    if (clientRef.current?.connected) return;
    if (clientRef.current) {
      try { clientRef.current.deactivate(); } catch {}
    }
    const client = createStompClient(
      token,
      handleWsMessage,
      () => setWsConnected(true),
      () => setWsConnected(false),
      (err) => {
        console.error('WS error:', err);
        setWsConnected(false);
      }
    );
    clientRef.current = client;
    client.activate();
  }, [token, handleWsMessage]);

  useEffect(() => {
    connectWs();
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [connectWs]);

  const loadHistory = useCallback(async (user) => {
    try {
      setError('');
      const history = await fetchMessageHistory(token, user);
      setMessages(history || []);
    } catch (err) {
      setError('Failed to load message history: ' + err.message);
      setMessages([]);
    }
  }, [token]);

  const handleSelectUser = (e) => {
    e.preventDefault();
    const user = targetInput.trim();
    if (!user) return;
    setTargetUser(user);
    setMessages([]);
    loadHistory(user);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !targetUser || !wsConnected) return;
    try {
      sendStompMessage(clientRef.current, text, targetUser);
      setInputText('');
    } catch (err) {
      setError('Failed to send: ' + err.message);
    }
  };

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>Echo</span>
          <span style={styles.username}>@{username}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusDot,
            background: wsConnected ? '#4ade80' : '#f87171'
          }} />
          <span style={styles.statusText}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          <form onSubmit={handleSelectUser} style={styles.sidebarForm}>
            <input
              type="text"
              placeholder="Enter username..."
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              style={styles.sidebarInput}
            />
            <button type="submit" style={styles.sidebarBtn}>Chat</button>
          </form>
          {targetUser && (
            <div style={styles.activeChat}>
              <div style={styles.activeChatAvatar}>
                {targetUser[0].toUpperCase()}
              </div>
              <div>
                <div style={styles.activeChatName}>{targetUser}</div>
                <div style={styles.activeChatStatus}>Direct Message</div>
              </div>
            </div>
          )}
        </aside>

        <div style={styles.chatArea}>
          {error && <div style={styles.errorBar}>{error}</div>}

          {!targetUser ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <h2 style={styles.emptyTitle}>Echo Messenger</h2>
              <p style={styles.emptyText}>
                Enter a username in the sidebar to start chatting
              </p>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderAvatar}>
                  {targetUser[0].toUpperCase()}
                </div>
                <span style={styles.chatHeaderName}>{targetUser}</span>
              </div>

              <div style={styles.messageList}>
                {messages.length === 0 && (
                  <div style={styles.noMessages}>No messages yet. Say hello!</div>
                )}
                {messages.map((msg, i) => {
                  const isMine = msg.senderUsername === username;
                  return (
                    <div
                      key={msg.id || i}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        ...styles.bubble,
                        ...(isMine ? styles.bubbleMine : styles.bubbleTheirs)
                      }}>
                        {!isMine && (
                          <div style={styles.bubbleSender}>{msg.senderUsername}</div>
                        )}
                        <div>{msg.text}</div>
                        <div style={styles.bubbleTime}>
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit'
                          }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} style={styles.inputBar}>
                <input
                  type="text"
                  placeholder={wsConnected ? 'Type a message...' : 'Connecting...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!wsConnected}
                  style={styles.messageInput}
                />
                <button
                  type="submit"
                  disabled={!wsConnected || !inputText.trim()}
                  style={styles.sendBtn}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f0f' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', background: '#1a1a2e', borderBottom: '1px solid #2a2a4a'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { fontSize: '20px', fontWeight: '700', color: '#7c6df0' },
  username: { fontSize: '13px', color: '#888' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' },
  statusText: { fontSize: '12px', color: '#888' },
  logoutBtn: {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid #444',
    background: 'transparent', color: '#ccc', fontSize: '12px', cursor: 'pointer'
  },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: {
    width: '240px', background: '#16213e', borderRight: '1px solid #2a2a4a',
    padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'
  },
  sidebarForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sidebarInput: {
    padding: '10px 12px', borderRadius: '8px', border: '1px solid #333',
    background: '#0f0f0f', color: '#e0e0e0', fontSize: '13px', outline: 'none'
  },
  sidebarBtn: {
    padding: '10px', borderRadius: '8px', border: 'none', background: '#7c6df0',
    color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
  },
  activeChat: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px', borderRadius: '8px', background: '#1a1a2e'
  },
  activeChatAvatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: '#7c6df0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '14px'
  },
  activeChatName: { fontSize: '14px', fontWeight: '600', color: '#e0e0e0' },
  activeChatStatus: { fontSize: '11px', color: '#888' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  errorBar: {
    padding: '10px 16px', background: '#3d1f1f', color: '#ff6b6b',
    fontSize: '13px', borderBottom: '1px solid #6b2b2b'
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', gap: '8px'
  },
  emptyIcon: { fontSize: '48px' },
  emptyTitle: { fontSize: '22px', fontWeight: '600', color: '#e0e0e0' },
  emptyText: { fontSize: '14px', color: '#666' },
  chatHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px', borderBottom: '1px solid #2a2a4a', background: '#1a1a2e'
  },
  chatHeaderAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#5b4dbf',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '13px'
  },
  chatHeaderName: { fontSize: '15px', fontWeight: '600', color: '#e0e0e0' },
  messageList: {
    flex: 1, overflow: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  noMessages: { textAlign: 'center', color: '#555', fontSize: '13px', marginTop: '40px' },
  messageRow: { display: 'flex' },
  bubble: {
    maxWidth: '65%', padding: '10px 14px', borderRadius: '12px',
    fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word'
  },
  bubbleMine: {
    background: '#7c6df0', color: '#fff',
    borderBottomRightRadius: '4px'
  },
  bubbleTheirs: {
    background: '#1a1a2e', color: '#e0e0e0',
    borderBottomLeftRadius: '4px'
  },
  bubbleSender: { fontSize: '11px', fontWeight: '600', color: '#7c6df0', marginBottom: '2px' },
  bubbleTime: { fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: 'right' },
  inputBar: {
    display: 'flex', gap: '10px', padding: '14px 20px',
    borderTop: '1px solid #2a2a4a', background: '#1a1a2e'
  },
  messageInput: {
    flex: 1, padding: '12px 14px', borderRadius: '8px', border: '1px solid #333',
    background: '#0f0f0f', color: '#e0e0e0', fontSize: '14px', outline: 'none'
  },
  sendBtn: {
    padding: '12px 24px', borderRadius: '8px', border: 'none',
    background: '#7c6df0', color: '#fff', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer'
  }
};
