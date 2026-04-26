import React, { useState, useEffect } from 'react';
import { DeviceList } from './components/DeviceList';
import { ChatWindow } from './components/ChatWindow';
import type { BlePeer } from '../../electron/preload';

export const App: React.FC = () => {
  const [devices, setDevices] = useState<BlePeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<BlePeer | null>(null);
  const [scanning, setScanning] = useState(false);
  const [profile, setProfile] = useState({ id: '', name: '', publicKey: '' });

  useEffect(() => {
    // Get profile
    window.api.profile.get().then(setProfile);

    // Listen for BLE events
    const cleanup = window.api.on.bleEvent((event) => {
      if (event.type === 'deviceFound') {
        setDevices(prev => {
          if (prev.some(d => d.id === event.peer.id)) return prev;
          return [...prev, event.peer];
        });
      } else if (event.type === 'scanStarted') {
        setScanning(true);
      } else if (event.type === 'scanStopped') {
        setScanning(false);
      }
    });

    return cleanup;
  }, []);

  const handleScan = async () => {
    if (scanning) {
      await window.api.bluetooth.stopScan();
    } else {
      await window.api.bluetooth.startScan();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f', color: '#eee' }}>
      <DeviceList
        devices={devices}
        selectedPeer={selectedPeer}
        scanning={scanning}
        onScan={handleScan}
        onSelectPeer={setSelectedPeer}
      />
      <ChatWindow peer={selectedPeer} profile={profile} />
    </div>
  );
};
