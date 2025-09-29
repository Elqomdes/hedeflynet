# Vercel Deployment Rehberi

## 🚀 Deployment Adımları

### 1. Environment Variables Ayarlama
Vercel dashboard'unda şu environment variable'ları ayarlayın:

```
MONGODB_URI=mongodb+srv://hedefly_db_user:emre42498*@hedeflydatas.8esydhl.mongodb.net/?retryWrites=true&w=majority&appName=hedeflydatas
```

**Önemli:** MongoDB Atlas connection string'inizi `MONGODB_URI` adıyla ekleyin.

### 2. MongoDB Atlas Ayarları
- Network Access'te `0.0.0.0/0` (tüm IP'ler) eklenmiş olmalı
- Database User'ın read/write permissions'ları olmalı
- Cluster'ın aktif olduğundan emin olun

### 3. Test Endpoint'leri
Deploy sonrası şu URL'leri test edin:

#### Health Check
```
GET https://your-site.vercel.app/api/health-check
```
**Beklenen yanıt:**
```json
{
  "status": "success",
  "message": "Server is healthy",
  "mongodb": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

#### Environment Variables Test
```
GET https://your-site.vercel.app/api/test-vercel-env
```
**Beklenen yanıt:**
```json
{
  "status": "success",
  "environment": {
    "NODE_ENV": "production",
    "VERCEL_ENV": "production",
    "MONGODB_URI": "SET",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Troubleshooting

#### MongoDB Bağlantı Hatası
- Environment variable'ın doğru ayarlandığını kontrol edin
- MongoDB Atlas'ta IP whitelist'ini kontrol edin
- Connection string'in doğru olduğunu kontrol edin

#### Build Hatası
- `npm run build` komutunu local'de çalıştırın
- TypeScript hatalarını kontrol edin
- Dependencies'lerin eksik olmadığını kontrol edin

#### Runtime Hatası
- Vercel function logs'unu kontrol edin
- Console.log'ları inceleyin
- API endpoint'lerini tek tek test edin

### 5. Performance Optimizasyonları

#### Vercel.json Ayarları
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### MongoDB Connection Pooling
- Connection pool size: 10
- Timeout ayarları optimize edilmiş
- Caching mekanizması aktif

### 6. Monitoring

#### Vercel Analytics
- Vercel dashboard'unda analytics'i aktifleştirin
- Function execution time'ları izleyin
- Error rate'leri takip edin

#### MongoDB Monitoring
- MongoDB Atlas'ta cluster metrics'leri izleyin
- Connection count'u takip edin
- Query performance'ı analiz edin

## 🔧 Hızlı Test Komutları

```bash
# Local build test
npm run build

# Local production test
npm start

# Health check test
curl https://your-site.vercel.app/api/health-check

# Environment test
curl https://your-site.vercel.app/api/test-vercel-env
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Vercel function logs'unu kontrol edin
2. MongoDB Atlas logs'unu inceleyin
3. Test endpoint'lerini çalıştırın
4. Environment variable'ları doğrulayın


