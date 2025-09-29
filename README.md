# Hedefly - Öğrenci Koçluk Platformu

Hedefly, Eduly Eğitim Teknolojileri altında geliştirilmiş modern bir öğrenci koçluk platformudur.

## Özellikler

### Kullanıcı Rolleri
- **Admin**: Öğretmenleri sisteme ekler, başvuruları yönetir
- **Öğretmen**: Öğrenci ekler, sınıf açar, ödev verir, koçluk yapar
- **Öğrenci**: Öğretmen tarafından eklenir, ödev/plan/quiz/sınavlara katılır

### Ana Özellikler
1. **İletişim Formu** - Öğretmenler başvuru yapar
2. **Öğretmen İşlevleri** - Öğrenci yönetimi, sınıf oluşturma, ödev verme
3. **Analiz Sayfası** - Öğrenci performans analizi ve raporlama
4. **Admin Paneli** - Başvuru yönetimi ve sistem kontrolü

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Ortam değişkenlerini ayarlayın:
```bash
# .env.local dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

**Not**: Gerçek veritabanı bilgilerinizi ve güvenli secret key'lerinizi kullanın. Bu örnekteki değerler sadece format göstergesidir.

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Teknolojiler

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Kimlik Doğrulama**: JWT, bcryptjs
- **Veritabanı**: MongoDB Atlas

## Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin paneli sayfaları
│   ├── ogretmen/          # Öğretmen paneli sayfaları
│   ├── ogrenci/           # Öğrenci paneli sayfaları
│   ├── api/               # API endpoints
│   └── globals.css        # Global stiller
├── components/            # React bileşenleri
├── lib/                   # Yardımcı kütüphaneler
│   ├── models/           # MongoDB modelleri
│   ├── auth.ts           # Kimlik doğrulama
│   └── mongodb.ts        # Veritabanı bağlantısı
├── types/                # TypeScript tip tanımları
└── utils/                # Yardımcı fonksiyonlar
```

## Kullanım

### Admin Paneli
- Öğretmen başvurularını inceleyin ve onaylayın
- Öğretmenleri aktif/pasif hale getirin
- Sistem istatistiklerini görüntüleyin

### Öğretmen Paneli
- Öğrenci ekleyin ve yönetin
- Sınıf oluşturun ve öğrenci atayın
- Ödev verin (bireysel veya sınıf)
- Öğrenci hedefleri belirleyin
- Analiz ve rapor oluşturun

### Öğrenci Paneli
- Ödevleri görüntüleyin ve tamamlayın
- Hedeflerinizi takip edin
- Planlarınızı görüntüleyin

## Lisans

Bu proje Eduly Eğitim Teknolojileri tarafından geliştirilmiştir.

## İletişim

- **E-posta**: iletisim@edulyedu.com
- **Ana Site**: edulyedu.com
- **Domain**: hedefly.net
