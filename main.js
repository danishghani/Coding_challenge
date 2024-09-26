const http = require('http');
const request = require('request');
const url = require('url');
const { from, forkJoin } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/I/want/title/') {
        const addresses = parsedUrl.query.address;

        if (!Array.isArray(addresses)) {
            return respondWithError(res, 'Invalid input');
        }

        let titlesHtml = '<html><head></head><body><h1> Following are the titles of given websites: </h1><ul>';

        const requests = addresses.map(address => 
            from(new Promise((resolve) => {
                request(address, (error, response, body) => {
                    if (error || response.statusCode !== 200) {
                        resolve({ address, title: 'NO RESPONSE' });
                    } else {
                        const matches = body.match(/<title>(.*?)<\/title>/);
                        const title = matches ? matches[1] : 'NO TITLE';
                        resolve({ address, title });
                    }
                });
            }))
        );

        forkJoin(requests).subscribe(results => {
            results.forEach(result => {
                titlesHtml += `<li> ${result.address} - "${result.title}" </li>`;
            });
            titlesHtml += '</ul></body></html>';
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(titlesHtml);
        });

    } else {
        res.writeHead(404);
        res.end();
    }
});

function respondWithError(res, message) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(message);
}

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    // http://localhost:3000/I/want/title/?address=google.com&address=http://yahoo.com
});
