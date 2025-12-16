# Vercel'e Deployment Rehberi

Bu rehber, Unfollow Cleaner uygulamasını Vercel'e deploy etmek için adım adım talimatlar içerir.

## Ön Hazırlık

### 1. GitHub'a Push Etme

Eğer henüz yapmadıysanız, projeyi GitHub'a push edin:

```bash
cd unfollow-cleaner
git init
git add .
git commit -m "Initial commit: Unfollow Cleaner app"
git branch -M main
git remote add origin https://github.com/bluexir/unfollow-cleaner.git
git push -u origin main
```

### 2. Neynar API Anahtarlarını Hazırlama

1. https://neynar.com adresine gidin
2. Giriş yapın veya hesap oluşturun
3. Dashboard'dan yeni bir app oluşturun
4. API Key ve Client ID'nizi kopyalayın

## Vercel'e Deployment

### Yöntem 1: Vercel Dashboard (Önerilen)

1. **Vercel'e Giriş Yapın**
   - https://vercel.com adresine gidin
   - GitHub hesabınızla giriş yapın

2. **Yeni Proje Oluşturun**
   - "New Project" butonuna tıklayın
   - GitHub repository'nizi bulun: `bluexir/unfollow-cleaner`
   - "Import" butonuna tıklayın

3. **Proje Ayarları**
   - Framework Preset: Next.js (otomatik algılanır)
   - Build Command: `npm run build` (varsayılan)
   - Output Directory: `.next` (varsayılan)

4. **Environment Variables Ekleyin**
   
   Aşağıdaki ortam değişkenlerini ekleyin:
   
   ```
   NEYNAR_API_KEY=your_actual_api_key
   NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_actual_client_id
   ```
   
   **ÖNEMLİ**: 
   - `NEYNAR_API_KEY` gizli olmalı (Production, Preview ve Development için ekleyin)
   - `NEXT_PUBLIC_NEYNAR_CLIENT_ID` public olmalı (tüm ortamlar için ekleyin)

5. **Deploy Edin**
   - "Deploy" butonuna tıklayın
   - Build tamamlanana kadar bekleyin (2-3 dakika)
   - Deploy başarılı olunca, Vercel size bir URL verecek

### Yöntem 2: Vercel CLI

```bash
# Vercel CLI'yi yükleyin
npm i -g vercel

# Vercel'e giriş yapın
vercel login

# İlk deployment
vercel

# Environment variables ekleyin
vercel env add NEYNAR_API_KEY
# Değeri girin ve Production, Preview, Development seçeneklerini seçin

vercel env add NEXT_PUBLIC_NEYNAR_CLIENT_ID
# Değeri girin ve Production, Preview, Development seçeneklerini seçin

# Production'a deploy edin
vercel --prod
```

## Build Hatalarını Çözme

### Hata: "Module not found: Can't resolve '@neynar/nodejs-sdk'"

**Çözüm:**
```bash
npm install @neynar/nodejs-sdk --save
git add package.json package-lock.json
git commit -m "Add Neynar SDK"
git push
```

### Hata: "NEYNAR_API_KEY is not set"

**Çözüm:**
1. Vercel dashboard'a gidin
2. Projenizi seçin
3. Settings > Environment Variables
4. Eksik değişkenleri ekleyin
5. Deployments sekmesinden "Redeploy" yapın

### Hata: PostCSS veya Tailwind hatası

**Çözüm:**
```bash
npm install -D tailwindcss postcss autoprefixer
git add package.json package-lock.json
git commit -m "Fix Tailwind dependencies"
git push
```

## Deployment Sonrası

### 1. Domain Yapılandırması (Opsiyonel)

Kendi domain'inizi kullanmak için:
1. Vercel dashboard'da projenize gidin
2. Settings > Domains
3. Custom domain ekleyin
4. DNS kayıtlarını güncelleyin

### 2. Test Etme

1. Vercel'in verdiği URL'i açın (örn: `unfollow-cleaner.vercel.app`)
2. "Sign in with Farcaster" butonuna tıklayın
3. Neynar authentication penceresinin açıldığını doğrulayın
4. Giriş yapıp uygulamayı test edin

### 3. Monitoring

Vercel otomatik olarak şunları sağlar:
- Real-time analytics
- Error tracking
- Performance monitoring
- Build logs

Dashboard'dan bu bilgilere erişebilirsiniz.

## Güncelleme ve Yeniden Deployment

Her GitHub'a push ettiğinizde, Vercel otomatik olarak yeniden deploy eder:

```bash
# Değişikliklerinizi yapın
git add .
git commit -m "Update: açıklama"
git push

# Vercel otomatik olarak yeni deployment başlatır
```

## Environment Variables Yönetimi

### Production için:
```bash
vercel env add VARIABLE_NAME production
```

### Preview (branch deployments) için:
```bash
vercel env add VARIABLE_NAME preview
```

### Development için:
```bash
vercel env add VARIABLE_NAME development
```

### Tüm ortamlar için:
Dashboard'dan "All Environments" seçeneğini kullanın.

## Rollback (Geri Alma)

Bir deployment'ı geri almak için:
1. Vercel dashboard > Deployments
2. Önceki başarılı deployment'ı bulun
3. "..." menüsünden "Promote to Production" seçin

## Support ve Yardım

### Vercel Desteği
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions

### Uygulama Sorunları
- GitHub Issues: https://github.com/bluexir/unfollow-cleaner/issues
- Farcaster: @bluexir

## Deployment Checklist

- [ ] GitHub'a code push edildi
- [ ] Vercel hesabı oluşturuldu
- [ ] Repository import edildi
- [ ] Environment variables eklendi (NEYNAR_API_KEY, NEXT_PUBLIC_NEYNAR_CLIENT_ID)
- [ ] İlk deployment başarılı
- [ ] Uygulama test edildi
- [ ] Neynar authentication çalışıyor
- [ ] API routes çalışıyor
- [ ] UI düzgün görünüyor

## Başarı!

Uygulamanız artık canlıda! 🎉

URL'inizi Farcaster'da paylaşabilir ve kullanıcılarınızın kullanmasını sağlayabilirsiniz.
