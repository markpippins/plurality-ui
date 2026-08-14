import { useEffect, useRef, useState, useCallback } from 'react';
import { wsService, WsMessage } from '../services/WebSocketService';

export function useWebSocket(wrId?: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const wrIdRef = useRef(wrId);

  useEffect(() => {
    wrIdRef.current = wrId;
  }, [wrId]);

  useEffect(() => {
    if (wrId) {
      wsService.connect(wrId);
      const unsub = wsService.onEvent(wrId, (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (msg.type === 'STATE_CHANGED' || msg.type === 'subscribed') {
          setConnected(true);
        }
      });
      const globalUnsub = wsService.onGlobalEvent((msg) => {
        if (msg.type === 'ERROR') {
          setConnected(false);
        }
      });
      return () => {
        unsub();
        globalUnsub();
      };
    } else {
      wsService.connect();
      const unsub = wsService.onGlobalEvent((msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => {
        unsub();
      };
    }
  }, [wrId]);

  const sendMessage = useCallback((type: string, payload?: Record<string, unknown>) => {
    if (wsService.readyState === WebSocket.OPEN) {
      wsService.subscribe(wrId || '');
      const ws = (wsService as any).ws as WebSocket | null;
      ws?.send(JSON.stringify({ type, wr_id: wrId, payload, timestamp: new Date().toISOString() }));
    }
  }, [wrId]);

  return { connected, messages, sendMessage };
}
