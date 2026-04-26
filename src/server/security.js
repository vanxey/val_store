export function setHeaders(res){
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://media.valorant-api.com;")
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
};