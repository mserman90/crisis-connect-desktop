import { contextBridge, ipcRenderer } from 'electron';

// ---- Type definitions ----
export interface SendPayload {
  toId: string;
  content: string;
  type?: 'text' | 'sos' | 'voice';
}

export interface BlePeer {
  id: string;
  name: string;
  rssi?: number;
  publicKey?: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  type: 'text' | 'sos' | 'voice';
  encrypted: boolean;
  timestamp: number;
  delivered: boolean;
}

export type BleEvent =
  | { type: 'deviceFound'; peer: BlePeer }
  | { type: 'deviceLost'; id: string }
  | { type: 'connected'; id: string }
  | { type: 'disconnected'; id: string }
  | { type: 'scanStarted' }
  | { type: 'scanStopped' }
  | { type: 'message'; message: ChatMessage }
  | { type: 'error'; error: string };

// ---- Expose API to renderer ----
contextBridge.exposeInMainWorld('api', {
  // Bluetooth
  bluetooth: {
    startScan: (): Promise<void> =>
      ipcRenderer.invoke('bluetooth:startScan'),
    stopScan: (): Promise<void> =>
      ipcRenderer.invoke('bluetooth:stopScan'),
    connect: (peerId: string): Promise<void> =>
      ipcRenderer.invoke('bluetooth:connect', peerId),
    disconnect: (peerId: string): Promise<void> =>
      ipcRenderer.invoke('bluetooth:disconnect', peerId),
    getPeers: (): Promise<BlePeer[]> =>
      ipcRenderer.invoke('bluetooth:getPeers'),
    getPublicKey: (): Promise<string> =>
      ipcRenderer.invoke('bluetooth:getPublicKey')
  },

  // Mesajlasma
  messaging: {
    send: (payload: SendPayload): Promise<void> =>
      ipcRenderer.invoke('messaging:send', payload),
    getHistory: (peerId: string): Promise<ChatMessage[]> =>
      ipcRenderer.invoke('messaging:getHistory', peerId),
    markDelivered: (messageId: string): Promise<void> =>
      ipcRenderer.invoke('messaging:markDelivered', messageId),
    broadcastSos: (location?: { lat: number; lon: number }): Promise<void> =>
      ipcRenderer.invoke('messaging:broadcastSos', location)
  },

  // Profil
  profile: {
    get: (): Promise<{ id: string; name: string; publicKey: string }> =>
      ipcRenderer.invoke('profile:get'),
    set: (name: string): Promise<void> =>
      ipcRenderer.invoke('profile:set', name)
  },

  // Event listeners
  on: {
    bleEvent: (cb: (event: BleEvent) => void): (() => void) => {
      const handler = (_: unknown, data: BleEvent) => cb(data);
      ipcRenderer.on('bluetooth:event', handler);
      return () => ipcRenderer.removeListener('bluetooth:event', handler);
    },
    notification: (cb: (msg: ChatMessage) => void): (() => void) => {
      const handler = (_: unknown, data: ChatMessage) => cb(data);
      ipcRenderer.on('messaging:notification', handler);
      return () =>
        ipcRenderer.removeListener('messaging:notification', handler);
    }
  }
});
