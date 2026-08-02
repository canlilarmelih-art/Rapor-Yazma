module.exports = {
  apps: [
    {
      name: "rapor-app",
      script: "./server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: process.env.RAPOR_HOST || "127.0.0.1",
        PORT: process.env.RAPOR_PORT || "5174",
        RAPOR_FIREBASE_PROJECT_ID: process.env.RAPOR_FIREBASE_PROJECT_ID || "rapor-yazma-pro",
        // E-posta 2FA (bkz. server.js isMfaConfigured): RESEND_API_KEY
        // ayarlanmadığı sürece boş kalır ve MFA otomatik devre dışı olur —
        // giriş akışı bugünkü gibi çalışmaya devam eder.
        RESEND_API_KEY: process.env.RESEND_API_KEY || "",
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "Experify <giris@experify.com.tr>",
      },
    },
  ],
};
