import { createServer }  from 'node:https';
import { readFileSync } from 'node:fs';
import { setHeaders } from './security.js';

const sslOptions = {
    key: readFileSync('./certs/private-key.pem'),
    cert: readFileSync('./certs/certificate.pem'),

    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3'
};

const server = createServer(sslOptions, (req, res) => {
    setHeaders(res)
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server shut down cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at https://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});