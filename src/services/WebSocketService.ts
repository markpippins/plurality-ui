export type WsEventType =
  | 'STATE_CHANGED'
  | 'ARTIFACT_CREATED'
  | 'NODE_COMPLETE'
  | 'EXECUTION_LOG'
  | 'VALIDATION_RESULT'
  | 'REPLAY_STARTED'
  | 'ERROR'
  | 'subscribed'
  | 'RESPONSE';

export type WsCommandType =
  | 'INIT_WR'
  | 'RUN_CURRENT'
  | 'ADVANCE'
  | 'PAUSE'
  | 'RESUME'
  | 'REPLAY_FROM'
  | 'APPLY_PATCH'
  | 'INJECT_FEEDBACK'
  | 'TRACE_ARTIFACT'
  | 'subscribe'
  | 'unsubscribe';

export interface WsMessage {
  type: string;
  session_id?: string;
  wr_id?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export type WsEventCallback = (message: WsMessage) => void;

const WS_BASE = import.meta.env.VITE_LOSM_WS_URL || 'ws://localhost:8000';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Map<string, Set<WsEventCallback>>();
  private globalSubscribers = new Set<WsEventCallback>();
  private isConnecting = false;
  private _sessionId: string | null = null;

  public connect(wrId?: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    const url = `${WS_BASE}/ws`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      if (wrId) {
        this.subscribe(wrId);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'subscribed' && msg.session_id) {
          this._sessionId = msg.session_id;
        }
        if (msg.wr_id && this.subscribers.has(msg.wr_id)) {
          this.subscribers.get(msg.wr_id)!.forEach((cb) => cb(msg));
        }
        this.globalSubscribers.forEach((cb) => cb(msg));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this._sessionId = null;
      this.reconnectTimer = setTimeout(() => this.connect(wrId), 3000);
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public subscribe(wrId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', wr_id: wrId }));
    }
  }

  public unsubscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe' }));
    }
  }

  public sendCommand(command: WsCommandType, wrId: string, payload?: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: command,
        wr_id: wrId,
        payload: payload || {},
      }));
    }
  }

  public onEvent(wrId: string, callback: WsEventCallback): () => void {
    if (!this.subscribers.has(wrId)) {
      this.subscribers.set(wrId, new Set());
    }
    this.subscribers.get(wrId)!.add(callback);
    return () => {
      this.subscribers.get(wrId)?.delete(callback);
    };
  }

  public onGlobalEvent(callback: WsEventCallback): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public get sessionId(): string | null {
    return this.sessionId;
  }
}

export const wsService = new WebSocketService();
