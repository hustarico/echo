import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMessageHistory,
  fetchRecentContacts,
  searchUsers,
  sendMessageRest
} from '../services/api';
import { createStompClient, sendStompMessage } from '../services/websocket';

export default function Chat() {
  const { token, username, logout } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

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
    setContacts((prev) => {
      const idx = prev.findIndex(
        (c) => c.senderUsername === dto.senderUsername || c.receiverUsername === dto.senderUsername
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = dto;
        return next;
      }
      return prev;
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
      () => { setWsConnected(false); }
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

  useEffect(() => {
    (async () => {
      try {
        setContactsLoading(true);
        const data = await fetchRecentContacts(token);
        setContacts(data || []);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setContactsLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!activeContact) return;
    (async () => {
      try {
        setHistoryLoading(true);
        setError('');
        const user = activeContact.senderUsername === username
          ? activeContact.receiverUsername
          : activeContact.senderUsername;
        const history = await fetchMessageHistory(token, user);
        setMessages(history || []);
      } catch (err) {
        setError('Failed to load conversation: ' + err.message);
        setMessages([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [activeContact, token, username]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchUsers(token, q.trim());
        setSearchResults(Array.isArray(results) ? results.filter((u) => u !== username) : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSearchResult = (user) => {
    setActiveContact({ senderUsername: username, receiverUsername: user, text: '', sentAt: '' });
    setSearchQuery('');
    setSearchResults([]);
    setMessages([]);
  };

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setMessages([]);
  };

  const getConversationPartner = (contact) => {
    if (!contact) return '';
    return contact.senderUsername === username ? contact.receiverUsername : contact.senderUsername;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    const partner = getConversationPartner(activeContact);
    if (!text || !partner) return;

    if (wsConnected && clientRef.current?.connected) {
      try {
        sendStompMessage(clientRef.current, text, partner);
        setInputText('');
        return;
      } catch (err) {
        console.error('WS send failed, falling back to REST:', err);
      }
    }

    try {
      await sendMessageRest(token, text, partner);
      const history = await fetchMessageHistory(token, partner);
      setMessages(history || []);
      setInputText('');
    } catch (err) {
      setError('Failed to send: ' + err.message);
    }
  };

  const partner = getConversationPartner(activeContact);

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>Echo</span>
          <span style={styles.username}>@{username}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusDot, background: wsConnected ? '#4ade80' : '#f87171' }} />
          <span style={styles.statusText}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            {searching && <div style={styles.searchSpinner} />}
            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map((u) => (
                  <div
                    key={u}
                    style={styles.searchResultItem}
                    onClick={() => handleSelectSearchResult(u)}
                  >
                    <div style={styles.resultAvatar}>{u[0].toUpperCase()}</div>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && !searching && searchResults.length === 0 && (
              <div style={styles.noResults}>No users found</div>
            )}
          </div>

          <div style={styles.contactsHeader}>Recent Conversations</div>

          <div style={styles.contactsList}>
            {contactsLoading && (
              <div style={styles.loadingText}>Loading contacts...</div>
            )}
            {!contactsLoading && contacts.length === 0 && (
              <div style={styles.loadingText}>
                No conversations yet. Search for a user above.
              </div>
            )}
            {contacts.map((contact, i) => {
              const isActive = activeContact &&
                getConversationPartner(contact) === getConversationPartner(activeContact);
              const name = getConversationPartner(contact);
              const preview = contact.text || '';
              return (
                <div
                  key={contact.id || i}
                  style={{
                    ...styles.contactItem,
                    ...(isActive ? styles.contactItemActive : {})
                  }}
                  onClick={() => handleSelectContact(contact)}
                >
                  <div style={styles.contactAvatar}>{name[0].toUpperCase()}</div>
                  <div style={styles.contactInfo}>
                    <div style={styles.contactName}>{name}</div>
                    <div style={styles.contactPreview}>{preview}</div>
                  </div>
                  {contact.sentAt && (
                    <div style={styles.contactTime}>
                      {new Date(contact.sentAt).toLocaleDateString([], {
                        month: 'short', day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div style={styles.chatArea}>
          {error && <div style={styles.errorBar}>{error}</div>}

          {!activeContact ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <h2 style={styles.emptyTitle}>Echo Messenger</h2>
              <p style={styles.emptyText}>
                Select a conversation or search for a user to start chatting
              </p>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderAvatar}>
                  {partner[0].toUpperCase()}
                </div>
                <span style={styles.chatHeaderName}>{partner}</span>
                <span style={{ ...styles.statusDot, background: wsConnected ? '#4ade80' : '#f87171', marginLeft: 'auto' }} />
              </div>

              <div style={styles.messageList}>
                {historyLoading && (
                  <div style={styles.loadingText}>Loading messages...</div>
                )}
                {!historyLoading && messages.length === 0 && (
                  <div style={styles.noMessages}>
                    No messages yet with {partner}. Say hello!
                  </div>
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
                  placeholder={wsConnected ? 'Type a message...' : 'WebSocket disconnected, sending via REST...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={styles.messageInput}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || historyLoading}
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
    width: '280px', background: '#16213e', borderRight: '1px solid #2a2a4a',
    display: 'flex', flexDirection: 'column'
  },
  searchBox: { padding: '12px', position: 'relative' },
  searchInput: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #333',
    background: '#0f0f0f', color: '#e0e0e0', fontSize: '13px', outline: 'none'
  },
  searchSpinner: {
    position: 'absolute', right: '20px', top: '22px', width: '14px', height: '14px',
    border: '2px solid #444', borderTopColor: '#7c6df0', borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  },
  searchResults: {
    position: 'absolute', top: '48px', left: '12px', right: '12px',
    background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px',
    zIndex: 10, maxHeight: '200px', overflow: 'auto'
  },
  searchResultItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', cursor: 'pointer', fontSize: '13px', color: '#e0e0e0'
  },
  resultAvatar: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#7c6df0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0
  },
  noResults: {
    position: 'absolute', top: '48px', left: '12px', right: '12px',
    background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px',
    padding: '12px', fontSize: '12px', color: '#888', textAlign: 'center', zIndex: 10
  },
  contactsHeader: {
    padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: '#666',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  contactsList: { flex: 1, overflow: 'auto' },
  contactItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', cursor: 'pointer', transition: 'background 0.15s'
  },
  contactItemActive: { background: '#1a1a2e' },
  contactAvatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: '#5b4dbf',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0
  },
  contactInfo: { flex: 1, minWidth: 0 },
  contactName: { fontSize: '14px', fontWeight: '600', color: '#e0e0e0' },
  contactPreview: { fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  contactTime: { fontSize: '10px', color: '#555', flexShrink: 0 },
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
  loadingText: { textAlign: 'center', color: '#555', fontSize: '13px', marginTop: '40px' },
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
