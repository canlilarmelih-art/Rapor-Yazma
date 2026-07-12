// Firebase web uygulaması yapılandırması (Faz 1).
//
// KURULUM: cloud/KURULUM.md adımlarını izleyin. Firebase Console'da web
// uygulaması kaydedilince verilen "firebaseConfig" değerlerini aşağıya
// yapıştırın ve APIKEY placeholder'ını gerçek değerle değiştirin.
//
// Bu değerler GİZLİ DEĞİLDİR (istemciye zaten iner); güvenlik sınırı
// Firestore Security Rules + Authentication'dır (bkz. cloud/firestore.rules).
//
// apiKey "YAPISTIR" olarak kaldığı sürece bulut senkronu tamamen devre dışı
// kalır ve uygulama bugünkü gibi yalnızca yerel çalışır.

const RAPOR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD9WBMu4orrhWZJPyqAUGiw3x44g8I0nWQ",
  authDomain: "rapor-yazma-pro.firebaseapp.com",
  projectId: "rapor-yazma-pro",
  appId: "1:762640171932:web:048527a8785598fb42fe59",
};
