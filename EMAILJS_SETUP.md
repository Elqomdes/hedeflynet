# EmailJS Kurulum Rehberi

## Gerekli Adımlar

### 1. EmailJS Dashboard'a Giriş
- [EmailJS Dashboard](https://dashboard.emailjs.com/) adresine gidin
- Hesap oluşturun veya giriş yapın

### 2. Service Oluşturma
- Dashboard'da "Email Services" bölümüne gidin
- "Add New Service" butonuna tıklayın
- Gmail, Outlook veya istediğiniz email servisini seçin
- Service ID: `service_iqwh4mo` (zaten ayarlanmış)

### 3. Template Oluşturma
- "Email Templates" bölümüne gidin
- "Create New Template" butonuna tıklayın
- Template ID'yi `template_contact` olarak ayarlayın

#### Template İçeriği:
```
Konu: Yeni Öğretmen Başvurusu - {{from_name}}

Merhaba Hedefly Ekibi,

Yeni bir öğretmen başvurusu alındı:

Ad Soyad: {{from_name}}
E-posta: {{from_email}}
Telefon: {{phone}}
Deneyim: {{experience}}
Branşlar: {{subjects}}
Mesaj: {{message}}

En kısa sürede değerlendirilmesi gerekiyor.

İyi çalışmalar,
Hedefly Sistemi
```

### 4. Public Key Alma
- Dashboard'da "Account" bölümüne gidin
- "API Keys" sekmesinde Public Key'i kopyalayın
- `src/app/iletisim/page.tsx` dosyasında `EMAILJS_PUBLIC_KEY` değerini güncelleyin

### 5. Test Etme
- İletişim sayfasına gidin
- Formu doldurun ve gönderin
- Email'in gelip gelmediğini kontrol edin

## Önemli Notlar

- Service ID zaten `service_iqwh4mo` olarak ayarlanmış
- Template ID `template_contact` olarak ayarlanmış
- Sadece Public Key'i değiştirmeniz yeterli
- Template'de kullanılan değişkenler:
  - `{{from_name}}` - Ad Soyad
  - `{{from_email}}` - E-posta
  - `{{phone}}` - Telefon
  - `{{experience}}` - Deneyim
  - `{{subjects}}` - Branşlar
  - `{{message}}` - Mesaj
  - `{{to_name}}` - Alıcı adı (Hedefly Ekibi)

## Sorun Giderme

- Eğer email gelmiyorsa, Public Key'in doğru olduğundan emin olun
- Template ID'nin doğru olduğundan emin olun
- Service'in aktif olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin
