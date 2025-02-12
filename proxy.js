const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    if (req.headers['content-type'] === 'application/xml') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            req.body = data;
            next();
        });
    } else {
        next();
    }
});

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use((req, res, next) => {
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-real-ip'];
    delete req.headers['forwarded'];
    next();
});

app.use((req, res, next) => {
    console.log(`Received request URL: ${req.method} @ ${req.originalUrl}`);
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
        selfHandleResponse: true,
        on: {
            // console.log JSON body and send result in JSON format as well
            proxyRes: (proxyRes, req, res) => {
                let body = [];
                proxyRes.on('data', (chunk) => {
                    body.push(chunk);
                });
                proxyRes.on('end', () => {
                    body = Buffer.concat(body).toString();
                    console.log(body);
                    res.json(JSON.parse(body));
                });
            },
        },
        logLevel: 'debug',
    })
);

const PORT = process.env.PORT || 7766;
app.listen(PORT, () => {
    console.log(`Forwarding Server is running at http://localhost:${PORT}`);
});