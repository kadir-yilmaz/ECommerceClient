# E-Commerce Client (Angular)

RxJS operatörleri ve reaktif programlama pratikleri üzerine inşa edilmiş Angular tabanlı bir e-ticaret arayüz projesidir.

## Teknolojiler ve Kütüphaneler

- **Framework**: Angular 14+
- **Styling**: SCSS & Angular Material
- **Notifications**: ngx-toastr
- **Loaders**: ngx-spinner
- **Authentication**: @auth0/angular-jwt & Social Login (Google, Facebook)
- **Real-time**: @microsoft/signalr (Backend entegrasyonu için)

## Öne Çıkan Özellikler

### Gelişmiş Kimlik Doğrulama
- JWT tabanlı oturum yönetimi.
- Google ve Facebook ile sosyal giriş desteği.
- Auth interceptor'lar ile otomatik token yönetimi.

### Sepet ve Sipariş Yönetimi
- Gerçek zamanlı sepet güncellemeleri.
- Admin paneli üzerinden dinamik ürün ve stok yönetimi.

### Dinamik UI Bileşenleri
- Veri tabloları, dialoglar ve direktifler ile zenginleştirilmiş kullanıcı arayüzü.
- Dosya yükleme (File Upload) entegrasyonu.

### API Entegrasyonu (Proxy Config)
- CORS sorunlarını aşmak ve geliştirme aşamasında kolaylık sağlamak için `proxy.conf.json` yapılandırması.
- **Cloudflare Tunnel Desteği**: Proxy yapılandırması, Cloudflare tünelleme üzerinden gelen isteklerde yaşanan **Client Side Rendering (CSR)** sorunlarını (özellikle origin uyumsuzluklarını) çözmek için optimize edilmiştir.
- Merkezi HTTP client servisi ile hata yönetimi ve interceptor desteği.

## Kurulum ve Çalıştırma

1. `ECommerceClient` dizinine gidin.
2. `npm install` komutu ile bağımlılıkları yükleyin.
3. Uygulamayı başlatın: `ng serve --proxy-config proxy.conf.json`.
4. Tarayıcınızda `http://localhost:4200` adresine gidin.

---
