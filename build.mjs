import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html','styles.css','app.js','timer.js','manifest.webmanifest','service-worker.js']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
console.log('App statica pronta in dist/');
