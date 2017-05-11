
var index = 0;

module.exports = {
    'GET /' : async (ctx,next)=>{
        let user = ctx.state.user;
        if(!user){
            index++;
            let name = '用户'+Math.floor(Math.random()*10);
            let user = {
                id: index,
                name: name,
                image: 'https://coding.net/static/fruit_avatar/Fruit-'+(index % 10)+'.png'
            };
            let value = Buffer.from(JSON.stringify(user)).toString('base64');
            console.log(`Set cookie value: ${value}`);
            ctx.cookies.set('name', value);
        }
        ctx.render('index.html',{user:user});
    }
}