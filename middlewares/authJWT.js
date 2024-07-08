const jwt=require('jsonwebtoken');
const User=require("../models/fantasy-users")
 
const verifyToken=(req,res,next)=>{
    if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0]==='JWT'){
        
        jwt.verify(req.headers.authorization.split(' ')[1], process.env.API_SECRET,async(err,decode)=>{
            if(err){
                req.user=undefined;
            }
            try{
                const user=await User.findOne({
                    _id:decode.id
                });
                req.user=user;
                next();
            }catch(err){
                res.status(500).send({message:err})
            }
        })
    }
    else{
        req.user=undefined;
        return res.status(400).send("not working")
    }
}
 
module.exports=verifyToken