# Crisis Connect Desktop

**Windows masaüstü uygulaması** - Offline-first P2P encrypted messaging and voice over Bluetooth. No internet required.

> Bu proje, [Crisis Connect](https://github.com/emirhan-duman/Crisis-Connect) mobil uygulamasının Windows için Electron + React + TypeScript tabanlı masaüstü versiyonudur.

---

## Özellikler

- **Bluetooth P2P İletişim**: Windows 10+ BLE GATT üzerinden mobil cihazlarla doğrudan haberleşme
- **Uçtan Uca Şifreleme**: ECDH P-256 + HKDF-SHA256 + AES-256-GCM (Android/iOS ile uyumlu)
- **Offline Mesajlaşma**: İnternet olmadan text, voice, SOS broadcast
- **Yerel Veri**: SQLite (better-sqlite3) ile tüm mesajlar cihazda saklanır
- **Sistem Tepsisi**: Arka planda çalışma, otomatik başlatma
- **Windows Installer**: electron-builder ile NSIS kurulum paketi

---

## Proje Yapısı

```
crisis-connect-desktop/
├── electron/
│   ├── main.ts              # Electron ana süreç, window + tray
│   ├── preload.ts           # IPC API surface (güvenli context bridge)
│   ├── bluetooth/
│   │   └── bleService.ts    # Windows BLE GATT servisi (TODO: noble-winrt)
│   ├── crypto/
│   │   └── crypto.ts        # ECDH + AES-GCM (Android Crypto.kt uyumlu)
│   ├── database/
│   │   └── dbService.ts     # SQLite lokal mesaj deposu
│   └── ipc/
│       └── messagingBridge.ts  # IPC handler registration
├── renderer/
│   ├── index.html
│   └── src/
│       ├── main.tsx         # React entry
│       └── components/      # UI bileşenleri (ChatWindow, DeviceList, vb.)
├── package.json
├── vite.config.ts
└── electron-builder.yml     # Windows installer config
```

---

## Kurulum ve Geliştirme

### Gereksinimler

- **Node.js** 18+
- **Windows 10/11** (Bluetooth BLE desteği için)
- **npm** veya **yarn**

### Adımlar

```bash
# 1. Depoyu klonla
git clone https://github.com/mserman90/crisis-connect-desktop.git
cd crisis-connect-desktop

# 2. Bağımlılıkları yükle
npm install

# 3. Development modunda çalıştır
npm run dev
# Vite dev sunucusu (localhost:5173) + Electron penceresi açılacak

# 4. Production build
npm run build

# 5. Windows installer oluştur
npm run dist
# release/ klasöründe .exe kurulum dosyası oluşur
```

---

## Teknoloji Stack

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Desktop Runtime** | Electron 30+ | Cross-platform desktop framework |
| **UI Framework** | React 18 + TypeScript | Component-based UI |
| **Build Tool** | Vite | Hızlı dev server + HMR |
| **Bluetooth** | Windows BLE API | noble-winrt / windows.devices.bluetooth (TODO) |
| **Kripto** | @noble/curves, @noble/hashes | ECDH P-256, HKDF, AES-GCM |
| **Veritabanı** | better-sqlite3 | Lokal SQLite mesaj deposu |
| **Installer** | electron-builder | NSIS Windows installer |

---

## Kripto Protokol (Mobil ile Uyumlu)

Android ve iOS versiyonlarıyla **wire-level uyumluluk** için aynı kripto pipeline:

1. **Anahtar Değişimi**: QR kod ile ECDH P-256 public key paylaşımı
2. **Session Key**: `HKDF-SHA256(ECDH_shared_secret) → AES-256 key`
3. **Mesaj Şifreleme**: `AES-256-GCM(plaintext) → ciphertext + auth_tag`
4. **BLE Taşıma**: Şifreli payload → chunking (MTU ~512B) → GATT write
5. **Mesh Relay**: Cihazlar şifreli paketi decrypt etmeden forward eder (E2EE korunur)

> 📘 Detaylar: [Crisis Connect README - Security Model](https://github.com/emirhan-duman/Crisis-Connect#security-model)

---

## TODO: Bluetooth Windows Entegrasyonu

**Mevcut durum**: `bleService.ts` iskelet + mock cihaz.

**Sonraki adımlar**:

1. ✅ `noble-winrt` veya `windows.devices.bluetooth` paketi ile Windows BLE stack entegrasyonu
2. ✅ GATT service discovery (Crisis Connect UUID: `0000fff0-...`)
3. ✅ BLE chunking layer (BleChunkSender/Receiver benzeri)
4. ✅ RFCOMM ses akışı (Opus codec, push-to-talk)
5. ✅ Mesh relay logic (TTL, dedup cache, store-forward)

---

## Kullanım Senaryoları

- **Afet Koordinasyonu**: Kurtarma ekipleri masaüstünde harita + mobil ekiplerle BT iletişim
- **Offline Meeting**: İnternet kesintisinde yerel P2P toplantı
- **Güvenli Mesajlaşma**: E2EE, sunucu yok, metadata leak yok
- **Acil Durum SOS**: Desktop'tan SOS broadcast → mobil cihazlar yakalar

---

## Lisans

MIT License - özgürce fork/modify/distribute edilebilir.

---

## İlgili Projeler

- **[Crisis Connect (Android/iOS)](https://github.com/emirhan-duman/Crisis-Connect)** - Kotlin + Swift native mobil app
- **[Briar](https://briarproject.org/)** - P2P messaging, Tor/BT kullanır
- **[Bridgefy](https://bridgefy.me/)** - Mesh messaging (closed-source)

---

## Katkıda Bulunma

Pull request'ler kabul edilir! Özellikle:

- Windows BLE stack entegrasyonu (`noble-winrt`)
- UI/UX iyileştirmeleri (dark mode, i18n)
- RFCOMM voice call implementasyonu
- Test coverage

---

## İletişim

Sorular için **GitHub Issues** veya orijinal Crisis Connect projesine katkı yapabilirsiniz.

**Developed with ❤️ for offline resilience**
