# Hedefly - Öğrenci Koçluk Platformu Kurulum Rehberi

## Gereksinimler

- Node.js 18+ 
- MongoDB 4.4+
- npm veya yarn

## Kurulum Adımları

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarlayın
`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# MongoDB Atlas Connection (Cloud)
MONGODB_URI=mongodb+srv://hedefly_db_user:emre42498*@hedeflydatas.8esydhl.mongodb.net/?retryWrites=true&w=majority&appName=hedeflydatas

# JWT Secret (32+ karakter)
JWT_SECRET=your-super-secret-jwt-key-here-must-be-at-least-32-characters-long

# Next.js Environment
NODE_ENV=development
```

**Not:** MongoDB Atlas (cloud) kullanıldığı için yerel MongoDB kurulumuna gerek yoktur.

### 3. MongoDB Atlas Bağlantısı
MongoDB Atlas (cloud) kullanıldığı için yerel MongoDB kurulumuna gerek yoktur. Bağlantı otomatik olarak yapılacaktır.

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Özellikler

- **Admin Paneli**: Öğretmen ve öğrenci yönetimi
- **Öğretmen Paneli**: Öğrenci koçluğu, ödev verme, hedef belirleme
- **Öğrenci Paneli**: Ödev takibi, hedef takibi, plan oluşturma
- **Güvenli Kimlik Doğrulama**: JWT tabanlı
- **Modern UI**: Tailwind CSS ile responsive tasarım

## Veritabanı Modelleri

- **User**: Kullanıcı bilgileri (admin, teacher, student)
- **Class**: Sınıf bilgileri
- **Assignment**: Ödev bilgileri
- **Goal**: Hedef bilgileri
- **Plan**: Plan bilgileri
- **Report**: Rapor bilgileri
- **TeacherApplication**: Öğretmen başvuru bilgileri

## API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Kullanıcı bilgileri

### Admin
- `GET /api/admin/stats` - İstatistikler
- `GET /api/admin/teachers` - Öğretmen listesi
- `POST /api/admin/create-teacher` - Öğretmen oluştur

### Öğretmen
- `GET /api/teacher/stats` - Öğretmen istatistikleri
- `GET /api/teacher/students` - Öğrenci listesi
- `GET /api/teacher/classes` - Sınıf listesi

### Öğrenci
- `GET /api/student/stats` - Öğrenci istatistikleri
- `GET /api/student/assignments` - Ödev listesi
- `GET /api/student/goals` - Hedef listesi

## Güvenlik

- JWT tabanlı kimlik doğrulama
- Şifre hashleme (bcrypt)
- Rate limiting
- Input validation
- XSS koruması

## Geliştirme

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Sorun Giderme

1. **MongoDB bağlantı hatası**: MongoDB servisinin çalıştığından emin olun
2. **JWT hatası**: JWT_SECRET'ın en az 32 karakter olduğundan emin olun
3. **Port hatası**: 3000 portunun kullanımda olmadığından emin olun

## Lisans

Bu proje Eduly Eğitim Teknolojileri tarafından geliştirilmiştir.