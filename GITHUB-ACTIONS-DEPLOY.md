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

Sunucuda uygulama klasoru ve PM2 uygulamasi bir kez hazir olmalidir:

```bash
cd /home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app
pm2 restart rapor-app --update-env
pm2 save
```

Workflow, aktarim sirasinda `server-data/` ve `backups/` klasorlerini korur. Her basarili deploy sonrasinda `rapor-app` yeniden baslatilir ve 5174, yoksa 5173 portu kontrol edilir.
