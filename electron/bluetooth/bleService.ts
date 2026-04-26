import { BrowserWindow } from 'electron';
import { DatabaseService } from '../database/dbService';
import type { BlePeer, BleEvent } from '../preload';

// Windows BLE servisi - TODO: noble-winrt entegrasyonu
export class BleService {
  private mainWindow: BrowserWindow;
  private db: DatabaseService;
  private isScanning = false;
  private connectedPeers: Map<string, BlePeer> = new Map();
  private discoveredPeers: Map<string, BlePeer> = new Map();

  private readonly CRISIS_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';

  constructor(mainWindow: BrowserWindow, db: DatabaseService) {
    this.mainWindow = mainWindow;
    this.db = db;
    console.log('[BleService] initialized');
  }

  async startScan(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;
    this.emit({ type: 'scanStarted' });
    // TODO: Windows BLE scan
    setTimeout(() => {
      const mock: BlePeer = { id: 'mock-001', name: 'Crisis Mobile', rssi: -60 };
      this.discoveredPeers.set(mock.id, mock);
      this.emit({ type: 'deviceFound', peer: mock });
    }, 2000);
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    this.emit({ type: 'scanStopped' });
  }

  async connect(peerId: string): Promise<void> {
    const peer = this.discoveredPeers.get(peerId);
    if (!peer) throw new Error('Peer not found');
    this.connectedPeers.set(peerId, peer);
    this.emit({ type: 'connected', id: peerId });
  }

  async disconnect(peerId: string): Promise<void> {
    this.connectedPeers.delete(peerId);
    this.emit({ type: 'disconnected', id: peerId });
  }

  async sendMessage(toId: string, payload: Uint8Array): Promise<void> {
    // TODO: GATT write + chunking
    console.log(`[BLE] send ${payload.length}B to ${toId}`);
  }

  getPeers(): BlePeer[] {
    return Array.from(this.discoveredPeers.values());
  }

  destroy(): void {
    this.stopScan();
    this.connectedPeers.forEach((_, id) => this.disconnect(id));
  }

  private emit(event: BleEvent): void {
    this.mainWindow.webContents.send('bluetooth:event', event);
  }
}
