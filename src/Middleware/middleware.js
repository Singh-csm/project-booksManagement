const  jwt  = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bookModel = require("../Models/bookModel");




const verifyToken = async (req,res,next)=>{
   
    let token = req.headers["x-api-key"]

    if(!token) return res.status(400).send({status:false,msg:"Token is mandatory"})

    if(!validator.isJWT(token)) return res.status(400).send({status:false,msg:"Token is invalid"})

    if(token){

    jwt.verify(token, "group2project-4",(err,tokenDetails)=>{
        if(err) return res.status(403).send({status:false,msg:"Token is Invalid or expire"})

       
        req.tokenDetails = tokenDetails
        next()
    })
    }else{
        return res.status(401).send({status:false,msg:"you are not authenticated"})
    }
   
}



const verifyTokenAndAuthorization = async(req,res,next)=>{
    verifyToken(req,res,async()=>{
            if(!mongoose.isValidObjectId(req.params.bookId)) return res.status(400).send({status:false,message:"Invalid bookId"})
            let book = await bookModel.findById(req.params.bookId)
            if(!book) return res.status(404).send({status:false,message:"Book not found, plz check bookId"})
            
        if(req.tokenDetails.userId === book.userId.toString()){
            next()
        }else{
            res.status(403).send({msg:"you are not authorized to perform this task"})
        }
    })
}






module.exports = {verifyToken,verifyTokenAndAuthorization}