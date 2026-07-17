# GitHub Actions ile Ubuntu Yayini

Bu proje `main` dalina gelen her push sonrasinda test edilir ve basariliysa Google Cloud Ubuntu sunucusundaki PM2 uygulamasina aktarilir.

## GitHub Environment

Repository icinde `Settings > Environments` altinda `production` adinda bir environment olusturun. Isterseniz deploy icin onay kisiti ekleyebilirsiniz.

Asagidaki secret degerlerini `production` environment icine ekleyin:

- `DEPLOY_HOST`: `34.136.126.221`
- `DEPLOY_USER`: `canlilar_melih`
- `DEPLOY_PATH`: `/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app`
- `DEPLOY_PORT`: SSH portu; standart kullanimda `22`
- `DEPLOY_SSH_KEY`: sadece deploy icin uretilmis SSH private key
- `DEPLOY_KNOWN_HOSTS`: `ssh-keyscan -H 34.136.126.221` ciktisi

Private key'i repository dosyasina koymayin. GitHub Actions bu degerleri secret olarak calisma aninda kullanir.

## Ubuntu hazirligi

Sunucuda uygulama klasoru ve PM2 uygulamasi bir kez hazir olmalidir. Yeni
deployment akisi `ecosystem.config.cjs` ile PM2'yi yeniden baslatir. Uygulama
yerel gelistirmede `127.0.0.1` adresine baglanir; production workflow ise
Nginx'in reverse proxy olarak erisebilmesi icin `RAPOR_HOST=0.0.0.0` ve
`RAPOR_PORT=5174` ortam degiskenlerini aktarir:

```bash
cd /home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app
RAPOR_HOST=0.0.0.0 RAPOR_PORT=5174 \
pm2 startOrRestart ecosystem.config.cjs --only rapor-app --update-env
pm2 save
```

Workflow, aktarim sirasinda `server-data/` ve `backups/` klasorlerini korur.
Her basarili deploy sonrasinda `rapor-app` yeniden baslatilir ve localhost
uzerinden 5174 portu kontrol edilir. 5174 portu public firewall'da acilmaz;
dis erisim Nginx'in 80/443 reverse proxy katmanindan yapilir.

## Ilk HTTPS kurulumu

Public IP'yi dogrudan acmak yerine bir alan adini sunucunun IP adresine
yonlendirin. DNS kaydi hazir olduktan sonra Ubuntu'da bir kez su komutu
calistirin:

```bash
cd /home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app
bash deploy/ubuntu/setup-https.sh rapor.ornek.com admin@ornek.com
```

Bu script Nginx'i 80/443 uzerinden reverse proxy olarak kurar, Let's Encrypt
sertifikasi alir ve PM2'deki 5174 servisine yonlendirir. Sertifika icin IP
yerine kullanilan alan adi gerekir. Bundan sonra uygulamaya `https://alan-adiniz`
ile erisin; 5174 portunu public firewall'da acik tutmayin.

## API guvenligi

Firebase Authentication ile giris yapan tarayici, API isteklerinde ID token
gonderir. Sunucu token'i Firebase sertifikalariyla dogrular; `/api/state`,
`/api/user-pois`, `/api/overpass` ve `/api/pdf-text` oturumsuz istekleri 401
ile reddeder. State ve kullanici noktasi dosyalari Firebase UID'ye gore ayri
klasorlere yazilir.
