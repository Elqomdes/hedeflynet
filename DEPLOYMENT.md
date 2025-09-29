# Hedefly - Deployment Guide

## Ön Gereksinimler

- Node.js 18+ 
- MongoDB Atlas hesabı
- Vercel/Netlify hesabı (opsiyonel)

## Environment Variables

Aşağıdaki environment variables'ları `.env.local` dosyasında tanımlayın:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://hedefly_db_user:emre42498*@hedeflydatas.8esydhl.mongodb.net/?retryWrites=true&w=majority&appName=hedeflydatas

# JWT Secret (minimum 32 karakter)
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long

# Next.js Environment
NODE_ENV=production
```

## Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# TypeScript kontrolü
npm run type-check

# Linting
npm run lint:fix
```

## Production Build

```bash
# Production build oluştur
npm run build

# Production sunucusunu başlat
npm start
```

## Vercel Deployment

1. GitHub repository'sini Vercel'e bağlayın
2. Environment variables'ları Vercel dashboard'da tanımlayın
3. Deploy butonuna tıklayın

## Güvenlik Notları

- MongoDB credentials'ları asla kodda hardcode etmeyin
- JWT secret'ı güçlü ve rastgele oluşturun (minimum 32 karakter)
- Production'da HTTPS kullanın
- Rate limiting aktif
- Input validation mevcut

## Performans Optimizasyonları

- Image optimization aktif
- CSS optimization aktif
- Compression aktif
- HTTP keep-alive aktif
- Static generation kullanılıyor

## Monitoring

- MongoDB Atlas monitoring kullanın
- Vercel Analytics aktif
- Error logging mevcut



