import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

export function createStompClient(token, onMessage, onConnect, onDisconnect, onError) {
  const client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: () => {},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
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
