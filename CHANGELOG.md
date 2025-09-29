# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygun olarak düzenlenmiştir.

## [3.3.0] - 2024-12-19

### Added
- **Gelişmiş Ödevlendirme Sistemi**
  - Ödevlere puan verme sistemi (0-100 arası)
  - Öğretmen geri bildirimi yazma özelliği
  - Ödev durum yönetimi (teslim edildi, değerlendirildi, geç teslim)
  - Maksimum puan belirleme özelliği
  - Teslim takip sistemi

- **Analiz ve Raporlama Sayfaları**
  - Öğretmen öğrenci analiz sayfası geliştirildi
  - Öğrenci kişisel analiz sayfası eklendi
  - Branş bazlı detaylı performans analizi
  - Görsel grafikler (pie chart, bar chart, line chart)
  - Aylık ilerleme takibi

- **Yeni API Endpoint'leri**
  - `/api/teacher/assignments/[id]/submissions` - Ödev teslimlerini görüntüleme
  - `/api/teacher/assignments/submissions/[id]/grade` - Ödev değerlendirme
  - `/api/student/analysis` - Öğrenci performans analizi

- **Veri Modeli Güncellemeleri**
  - AssignmentSubmission modeli genişletildi
  - Assignment modeline maxGrade alanı eklendi
  - Yeni durum türleri eklendi

### Changed
- **Öğretmen Dashboard'u**
  - Ödev analitikleri eklendi
  - Değerlendirme oranı gösterimi
  - Bekleyen değerlendirmeler takibi
  - Hızlı erişim bölümü

- **Öğrenci Dashboard'u**
  - Teslim ve değerlendirme oranları
  - Not takibi ve geri bildirim görüntüleme
  - Gelişmiş istatistik kartları

- **Öğretmen Ödev Yönetimi**
  - Teslimleri görüntüleme modalı
  - Değerlendirme modalı
  - Durum güncelleme sistemi

- **Öğrenci Ödev Sayfası**
  - Değerlendirme sonuçları gösterimi
  - Not ve geri bildirim görüntüleme
  - Durum filtreleme sistemi

### Technical
- MongoDB modelleri güncellendi
- API endpoint'leri genişletildi
- Frontend bileşenleri geliştirildi
- Performans optimizasyonları yapıldı
- Hata yönetimi iyileştirildi

## [3.2.0] - 2024-12-18

### Added
- Temel ödevlendirme sistemi
- Öğrenci ve öğretmen panelleri
- Admin yönetim sistemi
- MongoDB entegrasyonu
- JWT kimlik doğrulama

### Changed
- Proje yapısı Next.js 14 App Router'a geçirildi
- TypeScript entegrasyonu tamamlandı
- Tailwind CSS ile modern tasarım

## [3.1.0] - 2024-12-17

### Added
- İlk proje yapısı
- Temel sayfa şablonları
- MongoDB bağlantısı
- Kullanıcı rolleri sistemi

---

## Versiyonlama

Bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır:
- **MAJOR**: Geriye uyumsuz API değişiklikleri
- **MINOR**: Yeni özellikler (geriye uyumlu)
- **PATCH**: Hata düzeltmeleri (geriye uyumlu)
