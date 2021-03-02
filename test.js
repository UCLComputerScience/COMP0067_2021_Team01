var fs=require('fs')
//1.establish web server
//load http module
var http=require('http')
//create web server
var server=http.createServer()
//register 'request' event, if the request comes in, implement the binding function
server.on('request', function(req, res){
    var dir = '/Users/huweicong/Sites/localhost/webstorm/nodejs'
    var filePath = '/views/index.html'
    var url = req.url
    console.log(dir)
    console.log(url)
    if (url === '/') {
        fs.readFile(dir+filePath, function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (url.indexOf('/views/') === 0) {
        filePath = url
        fs.readFile(dir+filePath, function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (url.indexOf('/public/') === 0){
        fs.readFile(dir+url, function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            // res.setHeader('Content-Type', 'text/css, charset=utf-8')
            res.end(data)
        })
    }
})
//2.bind port number, start server
server.listen(3000, function () {
    console.log('server starts successfully.')
})