export async function handleProxy(token, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Proxy reached successfully', token: '✅ received' }));
}
