const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-real-ip'];
    delete req.headers['forwarded'];
    next();
});

app.get('/health', (req, res) => {
        res.send('service is running');
});

app.use('/', 
    createProxyMiddleware({
        target: process.env.TARGET || 'https://api.weixin.qq.com',
        changeOrigin: true,
        secure: true,
        onProxyReq: (proxyReq, req, res) => {
                proxyReq.removeHeader('x-forwarded-for');
                proxyReq.removeHeader('x-real-ip');
                proxyReq.removeHeader('forwarded');
        },
        logLevel: 'debug',
    })
);

const PORT = process.env.PORT || 7766;
app.listen(PORT, () => {
    console.log(`Forwarding Server is running at http://localhost:${PORT}`);
});
