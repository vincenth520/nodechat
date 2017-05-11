const fs = require('fs');

function addMapping(router,mapping){
    for(var url in mapping){
        if(url.startsWith('GET ')){
            var path = url.substring(4);
            router.get(path,mapping[url]);
            console.log(`regesit url:GET ${path}`);
        }else if(url.startsWith('POST ')){
            var path = url.substring(5);
            router.post(path,mapping[url]);
            console.log(`regesit url:POST ${path}`);
        }else if(url.startsWith('PUT ')){
            var path = url.substring(4);
            router.put(path,mapping[url]);
            console.log(`regesit url:PUT ${path}`);
        }else if(url.startsWith('DELETE ')){
            var path = url.substring(7);
            router.del(path,mapping[url]);
            console.log(`regesit url:DELETE ${path}`);
        }else{
            console.log('error url:${url}');
        }
    }
}



function addControllers(router, dir) {
    fs.readdirSync(__dirname + '/' + dir).filter((f) => {
        return f.endsWith('.js');
    }).forEach((f) => {
        console.log(`process controller: ${f}...`);
        let mapping = require(__dirname + '/' + dir + '/' + f);
        addMapping(router, mapping);
    });
}

module.exports=function(dir){
    let 
        controller_dir = dir||'controller',
        router = require('koa-router')();
    addControllers(router,controller_dir);
    return router.routes();
}