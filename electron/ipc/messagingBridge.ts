import { BrowserWindow, ipcMain } from 'electron';
import { BleService } from '../bluetooth/bleService';
import { DatabaseService } from '../database/dbService';
import { CrisisCrypto } from '../crypto/crypto';
import { v4 } from 'uuid';
import type { SendPayload, ChatMessage } from '../preload';

const cry = new CrisisCrypto();
const MY_ID = v4();

export function registerMessagingIpc(w: BrowserWindow, b: BleService, d: DatabaseService) {
  ipcMain.handle('bluetooth:startScan', () => b.startScan());
  ipcMain.handle('bluetooth:stopScan', () => b.stopScan());
  ipcMain.handle('bluetooth:connect', (_,id) => b.connect(id));
  ipcMain.handle('bluetooth:disconnect', (_,id) => b.disconnect(id));
  ipcMain.handle('bluetooth:getPeers', () => b.getPeers());
  ipcMain.handle('bluetooth:getPublicKey', () => cry.getPublicKey());

  ipcMain.handle('messaging:send', (_,p: SendPayload) => {
    const m: ChatMessage = {
      id: v4(), fromId: MY_ID, toId: p.toId, content: p.content,
      type: p.type||'text', encrypted:true, timestamp: Date.now(), delivered:false
    };
    d.saveMessage(m);
    // TODO: encrypt + BLE send
  });

  ipcMain.handle('messaging:getHistory', (_,pid) => d.getHistory(pid, MY_ID));
  ipcMain.handle('messaging:markDelivered', (_,mid) => {});
  ipcMain.handle('messaging:broadcastSos', (_,loc) => console.log('SOS',loc));
  ipcMain.handle('profile:get', () => ({id: MY_ID, name: 'User', publicKey: cry.getPublicKey()}));
  ipcMain.handle('profile:set', (_,n) => {});
}
