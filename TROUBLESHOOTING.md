# Sorun Giderme Rehberi

## Sınıf Oluşturma Sorunu

Eğer sınıf oluşturduğunuzda MongoDB'de görünmüyorsa, aşağıdaki adımları takip edin:

### 1. MongoDB Atlas Bağlantısını Kontrol Edin

MongoDB Atlas (cloud) kullanıldığı için yerel MongoDB servisine gerek yoktur. Bağlantı otomatik olarak yapılacaktır.

**Bağlantı String'i (örnek):**
```
mongodb+srv://<kullanici>:<parola>@<cluster-host>/?retryWrites=true&w=majority&appName=<uygulama-adi>
```

### 2. Ortam Değişkenlerini Kontrol Edin

`.env.local` dosyasında aşağıdaki değişkenlerin doğru olduğundan emin olun (örnek değerler kullanın, gerçek kimlik bilgilerini repoda paylaşmayın):

```env
MONGODB_URI=mongodb+srv://<kullanici>:<parola>@<cluster-host>/?retryWrites=true&w=majority&appName=<uygulama-adi>
JWT_SECRET=please-set-a-strong-secret-at-least-32-chars
NODE_ENV=development
```

### 3. Debug Sayfasını Kullanın

Tarayıcıda `http://localhost:3000/debug` adresine gidin ve:
- "MongoDB Bağlantısını Test Et" butonuna tıklayın
- "Sınıf Oluşturma Test Et" butonuna tıklayın
- "Sınıf Silme Test Et" butonuna tıklayın
- "Tüm Veri İşlemlerini Test Et" butonuna tıklayın
- "Öğrenci ve Sınıf Oluşturma Test Et" butonuna tıklayın

### 4. Konsol Loglarını Kontrol Edin

Geliştirme sunucusunu çalıştırırken terminalde şu logları görmelisiniz:

```
Creating new MongoDB connection...
MongoDB connected successfully
MongoDB connection established
```

### 5. Yaygın Hatalar ve Çözümleri

#### Hata: "MongoDB bağlantı hatası"
**Çözüm:** MongoDB servisinin çalıştığından emin olun
```bash
# Windows
net start MongoDB

# macOS/Linux
brew services start mongodb-community
# veya
sudo systemctl start mongod
```

#### Hata: "Unauthorized"
**Çözüm:** Öğretmen olarak giriş yapmış olduğunuzdan emin olun

#### Hata: "Sınıf adı gereklidir"
**Çözüm:** Sınıf adı alanını doldurun

#### Hata: "Bu isimde zaten bir sınıf mevcut"
**Çözüm:** Farklı bir sınıf adı kullanın

#### Hata: "Sınıf silinirken sunucu hatası"
**Çözüm:** 
1. Konsol loglarını kontrol edin
2. MongoDB bağlantısını test edin
3. Sınıf ID'sinin geçerli olduğundan emin olun
4. Öğretmen olarak giriş yaptığınızdan emin olun

#### Hata: "Veriler MongoDB'de kaydedilmiyor"
**Çözüm:**
1. MongoDB servisinin çalıştığından emin olun
2. `.env.local` dosyasında `MONGODB_URI` doğru mu kontrol edin
3. Debug sayfasında "Tüm Veri İşlemlerini Test Et" butonunu kullanın
4. Debug sayfasında "Öğrenci ve Sınıf Oluşturma Test Et" butonunu kullanın
5. Konsol loglarında hata mesajlarını kontrol edin
6. MongoDB'de veritabanının oluşturulduğunu kontrol edin
7. Browser console'da JavaScript hatalarını kontrol edin

#### Hata: "Öğrenci eklenirken hata oluştu"
**Çözüm:**
1. Öğretmen olarak giriş yapmış olduğunuzdan emin olun
2. Tüm gerekli alanları doldurun (ad, soyad, kullanıcı adı, e-posta, şifre)
3. Kullanıcı adı ve e-posta adresinin benzersiz olduğundan emin olun
4. Konsol loglarında detaylı hata mesajlarını kontrol edin

#### Hata: "Sınıf oluşturulurken hata oluştu"
**Çözüm:**
1. Öğretmen olarak giriş yapmış olduğunuzdan emin olun
2. Sınıf adını doldurun
3. Aynı isimde başka bir sınıf olmadığından emin olun
4. Konsol loglarında detaylı hata mesajlarını kontrol edin

### 6. Veritabanını Temizleme

Eğer test verilerini temizlemek istiyorsanız:

```javascript
// MongoDB shell'de
use hedefly
db.classes.deleteMany({})
db.users.deleteMany({})
```

### 7. Geliştirici Konsolu

Tarayıcıda F12 tuşuna basarak Developer Tools'u açın ve Console sekmesinde hata mesajlarını kontrol edin.

### 8. API Testi

Postman veya curl ile API'yi test edebilirsiniz:

```bash
curl -X POST http://localhost:3000/api/teacher/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sınıfı",
    "description": "Test açıklaması",
    "coTeacherIds": [],
    "studentIds": []
  }'
```

### 9. Log Dosyaları

Sunucu loglarını kontrol edin:
- Terminal çıktısında hata mesajları
- Browser console'da JavaScript hataları
- Network sekmesinde API istekleri

### 10. Yeniden Başlatma

Bazen basit bir yeniden başlatma sorunu çözebilir:

```bash
# Sunucuyu durdurun (Ctrl+C)
# Sonra tekrar başlatın
npm run dev
```

## İletişim

Sorun devam ederse, lütfen aşağıdaki bilgileri paylaşın:
- Hata mesajı
- Konsol logları
- MongoDB durumu
- İşletim sistemi
