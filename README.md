# v14 Moderasyon Botu ⚔️

Discord.js v14 tabanlı, güçlü ve sade moderasyon botu.

Sunucunuzu kolayca yönetmek için tasarlanmış, ihtiyacınız olan temel moderasyon komutlarını içerir.

---

## ⚙️ Özellikler

- Ban / Softban  
- Jail / Unjail  
- Mute / Unmute / VMute / Unvmute
- Sicil kontrol
- Temizleme (Mesaj silme)  
- Ping ve komutları sıralama  
- Kullanıcı moderasyon geçmişini tutma (ban, mute, jail, softban vb.)  
- Yetkiler, roller ve bot token dahil tüm ayarlar `config.json` dosyasından yönetilir  

---

## 🚀 Kurulum

1. Depoyu klonlayın:

```bash
git clone https://github.com/wastydev/v14-moderation.git
cd v14-moderation
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. `config.json` dosyasını açın ve aşağıdaki alanları kendinize göre düzenleyin:  
- Bot Token  
- Yetkili roller  
- Kanallar  
- Diğer ayarlar  

4. Botu başlatın:

```bash
node index.js
```

---

## 🛠 Komutlar

| Komut       | Açıklama                           | Yetki Seviyesi     |
|-------------|------------------------------------|--------------------|
| `/ban`      | Kullanıcıyı banlar                 | Yönetici ve üzeri  |
| `/softban`  | Mesajları silip kullanıcıyı banlar | Yönetici ve üzeri  |
| `/kick`     | Kullanıyı sunucudan atar           | Yönetici ve üzeri  |
| `/mute`     | Yazılı susturma yapar              | Moderatör ve üzeri |
| `/unmute`   | Yazılı susturmayı kaldırır         | Moderatör ve üzeri |
| `/vmute`    | Sesli susturma yapar               | Moderatör          |
| `/unvmute`  | Sesli susturmayı kaldırır          | Moderatör          |
| `/jail`     | Kullanıcıyı jail sistemine alır    | Yetkili roller     |
| `/unjail`   | Jail’den çıkarır                   | Yetkili roller     |
| `/purge`    | Kanalda mesajları topluca siler    | Yetkili roller     |
| `/sicil`    | Kullanıcının cezalarını sıralar    | Yetkili roller     |
| `/ping`     | Botun gecikmesini gösterir         | Geliştiriciler     |
| `/akomutlar`| Komutları sıralar, anlatır         | Geliştiriciler     |

---

## 📁 Dosya Yapısı

- `/commands`: Slash komut dosyaları  
- `/events`: Bot eventleri  
- `/utils`: Yardımcı fonksiyonlar (history, tarih biçimlendirme vb.)  
- `config.json`: Bot ayarları ve yetki rolleri  
- `package.json`: Proje bağımlılıkları ve scriptler  

---

## ⚠️ Önemli Notlar

- Bot token, yetkiler ve ayarlar **sadece** `config.json` üzerinden ayarlanır.  
- `.env` dosyası **kullanılmamaktadır**.  
- Node.js sürümü **16 ve üzeri** olmalıdır.  

---

## 📬 İletişim

Herhangi bir sorun veya öneri için [Discord @wastyinnit](https://discord.gg/gbxCsRFR9x) üzerinden iletişime geçebilirsiniz.

---

**v14 Moderasyon Botu** ile sunucunuzu kolayca yönetin, düzeni sağlayın! 🚀
