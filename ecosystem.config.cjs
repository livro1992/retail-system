/**
 * PM2: avvio dei microservizi Nest (Nx serve) con log e restart centralizzati.
 *
 * Comandi utili (dalla root del monorepo):
 *   npm run pm2:start    → avvia tutti
 *   npm run pm2:stop     → ferma e rimuove i processi
 *   npm run pm2:restart  → riavvia tutti
 *   npm run pm2:logs     → log in streaming (Ctrl+C per uscire)
 *   npm run pm2:monit    → dashboard risorse
 *   npx pm2 status       → stato rapido
 */
const path = require('path');

const cwd = __dirname;
const nx = path.join(cwd, 'node_modules', 'nx', 'bin', 'nx.js');

const apps = [
  { name: 'retail-api-gateway', args: ['serve', 'api-gateway'] },
  { name: 'retail-auth-service', args: ['serve', 'auth-service'] },
  { name: 'retail-order-service', args: ['serve', 'order-service'] },
  { name: 'retail-inventory-service', args: ['serve', 'inventory-service'] },
].map(({ name, args }) => ({
  name,
  cwd,
  script: nx,
  args,
  interpreter: 'node',
  instances: 1,
  autorestart: true,
  watch: false,
  max_restarts: 20,
  min_uptime: '10s',
  exp_backoff_restart_delay: 2000,
  merge_logs: true,
  time: true,
  // Cartella log PM2 (default: ~/.pm2/logs); puoi forzare path assoluti se serve
  error_file: path.join(cwd, 'logs', `pm2-${name}.error.log`),
  out_file: path.join(cwd, 'logs', `pm2-${name}.out.log`),
}));

module.exports = { apps };
