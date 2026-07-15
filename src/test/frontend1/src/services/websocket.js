import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const WS_URL = 'http://localhost:8080/ws';

export function createStompClient(token, onMessage, onConnect, onDisconnect, onError) {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: (str) => {
      console.log('[STOMP]', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('[STOMP] Connected');
      client.subscribe('/user/topic', (message) => {
        try {
          const body = JSON.parse(message.body);
          onMessage(body);
        } catch (e) {
          console.error('[STOMP] Failed to parse message:', e);
        }
      });
      onConnect();
    },
    onDisconnect: () => {
      console.log('[STOMP] Disconnected');
      onDisconnect();
    },
    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers?.message);
      onError(frame);
    },
    onWebSocketError: (event) => {
      console.error('[STOMP] WebSocket error:', event);
      onError(event);
    }
  });

  return client;
}

export function sendStompMessage(client, text, sentTo) {
  if (!client || !client.connected) {
    throw new Error('Not connected to WebSocket');
  }
  client.publish({
    destination: '/app/chat.private',
    body: JSON.stringify({ text, sentTo })
  });
}
