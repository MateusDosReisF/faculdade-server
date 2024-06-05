const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const databaseFile = path.join(__dirname, 'urls.json');
let database = {};

// Carregar o banco de dados de um arquivo JSON, se existir
if (fs.existsSync(databaseFile)) {
    const data = fs.readFileSync(databaseFile, 'utf8');
    database = JSON.parse(data);
}

// Função para salvar o banco de dados em um arquivo JSON
function saveDatabase() {
    try {
        fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2));
        console.log('Banco de dados salvo com sucesso em', databaseFile);
    } catch (error) {
        console.error('Erro ao salvar o banco de dados:', error);
    }
}

// Método para gerar um ID curto único
function generateShortId() {
    return Math.random().toString(36).substring(2, 8);
}

// Método para encurtar uma URL e persisti-la no banco de dados no caso estou utilizando um json para armazena
function shortenUrl(originalUrl) {
    try {
        const shortId = generateShortId();
        console.log('Tentando encurtar URL. ID curto gerado:', shortId);
        database[shortId] = { originalUrl, createdAt: new Date() };
        saveDatabase();
        console.log('URL encurtada com sucesso. URL original:', originalUrl, 'ID curto:', shortId);
        return shortId;
    } catch (error) {
        console.error('Erro ao encurtar a URL:', error);
        return null;
    }
}

// Método para obter a URL original a partir do ID encurtado
function getOriginalUrl(shortId) {
    return database[shortId] ? database[shortId].originalUrl : null;
}

// Método para retornar todas as URLs encurtadas em uma data específica
function getUrlsByDate(date) {
    const dateString = date.toISOString().split('T')[0];
    const urls = [];
    for (const shortId in database) {
        if (database.hasOwnProperty(shortId)) {
            const url = database[shortId];
            const urlDateString = new Date(url.createdAt).toISOString().split('T')[0];
            if (urlDateString === dateString) {
                urls.push({ 
                    shortId, 
                    originalUrl: url.originalUrl, 
                    urlCurta: `http://localhost:3000/${shortId}` 
                });
            }
        }
    }
    return urls;
}

// Método para retornar uma URL encurtada com base na URL original
function getShortUrl(originalUrl) {
    for (const shortId in database) {
        if (database.hasOwnProperty(shortId)) {
            const url = database[shortId];
            if (url.originalUrl === originalUrl) {
                return shortId;
            }
        }
    }
    return null;
}

// Inicia nosso servidor na porta 3000
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
        //pegados do usuario pelo url o link do mesmo para encurtamos
    if (req.method === 'GET' && pathname === '/url' && query.url) {
        const originalUrl = query.url;
        const shortId = shortenUrl(originalUrl);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ shortUrl: `http://localhost:3000/${shortId}` }));
    } else if (req.method === 'GET' && pathname === '/getOriginalUrl' && query.shortId) {
        const originalUrl = getOriginalUrl(query.shortId);
        if (originalUrl) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ originalUrl }));
        } else {
            res.writeHead(404);
            res.end('URL não encontrada');
        }
    } else if (req.method === 'GET' && pathname === '/getUrlsData' && query.date) {
        const urls = getUrlsByDate(new Date(query.date));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(urls));
    } else if (pathname.length === 7 && pathname.startsWith('/')) {
        const shortId = pathname.substr(1);
        const originalUrl = getOriginalUrl(shortId);
        if (originalUrl) {
            res.writeHead(302, { 'Location': originalUrl });
            res.end();
        } else {
            res.writeHead(404);
            res.end('URL não encontrada');
        }
    } else {
        res.writeHead(404);
        res.end('Endpoint não encontrado');
    }
});

server.listen(3000, () => {
    console.log('Servidor na porta 3000');
});
