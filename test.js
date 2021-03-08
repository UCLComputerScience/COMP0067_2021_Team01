var fs=require('fs')
//1.establish web server
//load http module
var http=require('http')
var template=require('art-template')
var url=require('url')
var modules=[
    {
        name: "App engineering",
        info: "This is a mandatory module 1 \\\\n Week1: lecture1 \\\\n Week2: lecture2 \\\\n Week1: lecture3"
    },
    {
        name: "Software engineering",
        info: "This is a mandatory module 2. \\n Week1: lecture1 \\n Week2: lecture2 \\n Week1: lecture3"
    },
    {
        name: "Artificial intelligence",
        info: "This is a mandatory module 3. \\n Week1: lecture1 \\n Week2: lecture2 \\n Week1: lecture3"
    },
    {
        name: "Machine learning",
        info: "This is a mandatory module 4. \\n Week1: lecture1 \\n Week2: lecture2 \\n Week1: lecture3"
    },
    {
        name: "Algorithm",
        info: "This is a mandatory module 5. \\n Week1: lecture1 \\n Week2: lecture2 \\n Week1: lecture3"
    }
]


//create web server
var server=http.createServer()

//register 'request' event, if the request comes in, implement the binding function
server.on('request', function(req, res){
    // parse the invited url to get the form
    var parseObj = url.parse(req.url, true)
    var filePath = parseObj.pathname
    // var query = parseObj.query
    // query.id = '123'
    // console.log(query)
    if (filePath === '/') {
        fs.readFile('./views/index.html', function (err, data) {
            if (err) {
                fs.readFile('./views/404.html', function (err, data) {
                    if (err) {
                        return res.end('404 not found')
                    }
                    res.end(data)
                })
            }
            var htmlStr = template.render(data.toString(), {
                module: modules
            })
            res.end(htmlStr)
        })
    } else if (filePath.indexOf('/module') === 0) {
        fs.readFile('./views/module.html', function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (filePath.indexOf('/admin') === 0) {
        fs.readFile('./views/admin.html', function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (filePath.indexOf('/student') === 0) {
        fs.readFile('./views/student.html', function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (filePath.indexOf('/group') === 0) {
        fs.readFile('./views/group.html', function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    } else if (filePath.indexOf('/public/') === 0){
        fs.readFile('.'+filePath, function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            // res.setHeader('Content-Type', 'text/css, charset=utf-8')
            res.end(data)
        })
    } else {
        fs.readFile('./views/404.html', function (err, data) {
            if (err) {
                return res.end('404 not found')
            }
            res.end(data)
        })
    }
})
//2.bind port number, start server
server.listen(3000, function () {
    console.log('server starts successfully.')
})