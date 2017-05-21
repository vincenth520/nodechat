const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const db = mongoose.createConnection('localhost','test');
db.on('error',console.error.bind(console,'连接错误:'));
db.once('open',function(){
    console.log('链接成功')
})

const ChatSchema = new mongoose.Schema({
  user:String,  
  data:String,
  time:String   
});

module.exports = {
    'GET /api/getMsg' : async (ctx,next)=>{  
	    const msg = new Array();
		const ChatModel = db.model('Chat', ChatSchema);
		ChatModel.find().sort('-time').limit(10).exec(function (err, data) {
		  //if (err) return console.error(err);	
			msg.push(data);
	    	ctx.response.type = 'application/json';
	        ctx.response.body = msg; 
		})   	 	       
    }
}