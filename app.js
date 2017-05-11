const Koa = require('koa');
const url = require('url');
const ws = require('ws');
const Cookies = require('cookies');
const bodyParser = require('koa-bodyparser');
const controller = require('./controller');
const template = require('./templating');

const WebSocketServer = ws.Server; 

const app = new Koa();


//打印url信息
app.use(async (ctx,next) => {
    console.log(`Process url ${ctx.request.method} ${ctx.request.url}`);
    await next();
});

//获取用户信息
app.use(async (ctx,next) => {
    ctx.state.user = parseUser(ctx.cookies.get('name') || '');
    await next();
})

//处理静态文件夹
let staticFiles = require('./static-files');
app.use(staticFiles('/static/' , __dirname + '/static'));

app.use(bodyParser());

app.use(template('views',{
    noCache:true,
    watch:true
}));

app.use(controller());

let server = app.listen(3000);

function parseUser(obj){
    if(!obj){
        return;
    }

    console.log(`try parse ` + obj);
    let s = '';
    if(typeof obj === 'string'){
        s = obj;
    }else if(obj.headers){
        let cookies = new Cookies(obj,null);
        s = cookies.get('name');
    }

    if(s){
        try{
            let user = JSON.parse(Buffer.from(s,'base64').toString());
            console.log(`user:${user.name},id:${user.id}`);
            return user;
        }catch(e){
            //ignore
        }
    }
}


function createWebSocketServer(server,onConnection,onMessage,onClose,onError){
    let wss = new WebSocketServer({
        server
    });

    wss.broadcast = function broadcast(data){
        wss.clients.forEach(function each(client){
            client.send(data);
        });
    };

    onConnection = onConnection || function(){
        console.log(`[Websocket connected]`);
    }
    onMessage = onMessage || function(msg){
        console.log(`[Websocket recived msg:${msg}]`);
    }
    onClose = onClose || function(code,msg){
        console.log(`[Websocket closed ${code} - ${msg}]`);
    }
    onError = onError || function(error){
        console.log(`[Websocket err:${error}]`);
    }

    wss.on('connection',function(ws){
        let location = url.parse(ws.upgradeReq.url,true);
        console.log(`[WebSocketServer] connection:${location.href}`);
        ws.on('message',onMessage);
        ws.on('close',onClose);
        ws.on('error',onError);

        if(location.pathname !== '/ws/chat'){
            ws.close(4000,'Invaid url');
        }

        let user = parseUser(ws.upgradeReq);
        if(!user){
            ws.close(4001,'Invaid user');
        }

        ws.user = user;
        ws.wss = wss;
        onConnection.apply(ws);
    });
    console.log(`WebSocketServer attached`);
    return wss;
}

var messageIndex = 0;

function createMessage(type,user,data){
    messageIndex++;
    return JSON.stringify({
        id:messageIndex,
        type:type,
        user:user,
        data:data
    });
}


function onConnect(){
    let user = this.user;
    let msg = createMessage('join',user,`${user.name} 加入了聊天室.`);
    this.wss.broadcast(msg);

    let users = this.wss.clients.map(function (client) {
        return client.user;
    });

    this.send(createMessage('list',user,users));
}

function onMessage(message){
    console.log(message);
    if(message && message.trim()){
        let msg = createMessage('chat',this.user,message.trim());
        this.wss.broadcast(msg);
    }
}

function onClose(){
    let user = this.user;
    let msg = createMessage('close',user,`${user.name} 退出了聊天室`);
    this.wss.broadcast(msg);
}

app.wss = createWebSocketServer(server,onConnect,onMessage,onClose);

console.log(`app started at port 3000...`);