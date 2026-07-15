const cluster = require('node:cluster');
const os = require('node:os');

// Batasi jumlah worker agar tidak kehabisan RAM/koneksi DB
const MAX_WORKERS = Math.min(os.cpus().length, 8);

if (cluster.isPrimary) {
  console.log(`[Cluster] Primary process ${process.pid} spawning ${MAX_WORKERS} workers...`);

  for (let i = 0; i < MAX_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker: any, code: number) => {
    console.warn(`[Cluster] Worker ${worker.process.pid} exited (code ${code}). Restarting...`);
    cluster.fork();
  });
} else {
  // Setiap worker menjalankan NestJS secara independen
  require('./main');
}
