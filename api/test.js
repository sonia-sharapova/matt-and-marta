const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('API is working!\n');
});
server.listen(3000, () => {
    console.log('Test server running on port 3000');
});
