import React from 'react';
import type { BlePeer } from '../../../electron/preload';

type Props = {
  devices: BlePeer[];
  selectedPeer: BlePeer | null;
  scanning: boolean;
  onScan: () => void;
  onSelectPeer: (peer: BlePeer) => void;
};

export const DeviceList: React.FC<Props> = ({ devices, selectedPeer, scanning, onScan, onSelectPeer }) => (
  <div style={{ width: 280, borderRight: '1px solid #333', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <h2 style={{ margin: 0, fontSize: 18 }}>Bluetooth Cihazlar</h2>
    <button
      onClick={onScan}
      style={{
        padding: '10px 16px',
        background: scanning ? '#d32f2f' : '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500
      }}
    >
      {scanning ? 'Taramayı Durdur' : 'Taramaya Başla'}
    </button>
    <div style={{ fontSize: 12, color: '#888', marginTop: -4 }}>
      {scanning ? '🔵 Taranıyor...' : `${devices.length} cihaz bulundu`}
    </div>
    <div style={{ flex: 1, overflowY: 'auto', marginTop: 8 }}>
      {devices.length === 0 ? (
        <div style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
          Henüz cihaz bulunamadı
        </div>
      ) : (
        devices.map(device => (
          <div
            key={device.id}
            onClick={() => onSelectPeer(device)}
            style={{
              padding: '12px 14px',
              background: selectedPeer?.id === device.id ? '#1a1a1a' : 'transparent',
              borderRadius: 8,
              marginBottom: 8,
              cursor: 'pointer',
              border: selectedPeer?.id === device.id ? '1px solid #1976d2' : '1px solid #222',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontWeight: 500, fontSize: 14 }}>{device.name || 'Bilinmeyen Cihaz'}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              {device.rssi ? `RSSI: ${device.rssi} dBm` : device.id.slice(0, 12)}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
