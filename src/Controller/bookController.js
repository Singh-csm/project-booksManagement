const bookModel = require("../Models/bookModel")


const  mongoose  = require("mongoose")
const validator = require("validator")
const userModel = require("../Models/userModel")
const reviewModel = require("../Models/reviewModel")
const { findOneAndUpdate } = require("../Models/userModel")


// let isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/g
let isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
let validateTitle = /^[^0-9][a-z , A-Z0-9_ ? @ ! $ % & * : ]+$/
let validReview = /^[a-z , A-Z0-9_]+$/



const createBook = async (req,res)=>{
    try {
    let data = req.body

    if(Object.keys(data).length===0) return res.status(400).send({status:false,msg:"plz provide valid details"})

    let {title,excerpt,userId,ISBN,category,subcategory,reviews,releasedAt} = data
   
    if (!title) { return res.status(400).send({ status: false, message: "title is required" }) }

    if(!validateTitle.test(title))  return res.status(400).send({status:false,msg:"plz provide valid title"})

    if(!excerpt) return res.status(400).send({status:false,msg:"excerpt is mandatory"})
    
    if(!validateTitle.test(excerpt))  return res.status(400).send({status:false,msg:"plz provide valid excerpt"})

    if(!userId) return res.status(400).send({status:false,msg:"userId is mandatory"})
    userId = data.userId.trim()
    data.userId = userId
    if(!mongoose.isValidObjectId(userId)) return res.status(400).send({status:false,msg:"plz provide valid userId"})
    if(userId != req.tokenDetails.userId) return res.status(400).send({status:false,msg:"This userId is not exist in token"})
    if(!ISBN) return res.status(400).send({status:false,msg:"ISBN is mandatory"})
    if(!isbnRegex.test(ISBN)) return res.status(400).send({status:false,message:"Invalid ISBN"})

    if(!category) return res.status(400).send({status:false,msg:"category is mandatory"})
    if(!validateTitle.test(category))  return res.status(400).send({status:false,msg:"plz provide valid category"})

    if(!subcategory) return res.status(400).send({status:false,msg:"subcategory is mandatory"})
    if(!validateTitle.test(subcategory))  return res.status(400).send({status:false,msg:"plz provide valid subcategory"})
   
   
    

        
        if(!releasedAt) return res.status(400).send({status:false,message:"releaseDate is mandatory, formate should be in (YYYY/MM/DD) "})
        if(!validator.isDate(releasedAt)) return res.status(400).send({status:false,message:"Invalid date or formate,plz send date in this formate (YYYY/MM/DD) "})
        // if(currentDate!=data.releasedAt) return res.status(400).send({status:false,message:"plz send date when you are creating this book (YYYY/MM/DD) "})
    
       
    if(reviews) {
        if(typeof(reviews) != "number") return res.status(400).send({status:false,msg:"plz provide valid review"})
        data.reviews = 0
    }

    let findUser = await userModel.findById({_id:userId})
    if(!findUser) return res.status(404).send({status:true,message:"User not found, check userId"})
    

    let findBook = await bookModel.findOne({ $or: [{ title: title }, { ISBN: ISBN }] })
    if(findBook) return res.status(409).send({status:false,message:"given details already exist"})

   
    let createBook = await bookModel.create(data)
    
    let {__v,  ...otherData} = createBook._doc
   
    
    res.status(201).send({status:true,data:otherData})
   } catch (error) {
    console.log("error in create book", error.message);
    res.send(error.message)
   }
  
}

const getBooks = async(req,res)=>{
    try {
    let data = req.query
  
    let keys = Object.keys(data)
        keys.forEach((x)=>{
            return x.toLowerCase()
        })
    data.isDeleted = false

    if(keys.length===0) {
        let getAllBooks = await bookModel.find(data).sort({ title: 1 }).select({ ISBN: 0, subcategory: 0, isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if(getAllBooks.length===0) return res.status(404).send({status:false,message:"document not found"})
        let lengthOfAllbooks = getAllBooks.length
        return res.status(200).send({status:true,TotalBooks:lengthOfAllbooks,data:getAllBooks})
    }

    if(keys.includes("userId")){
        if(!mongoose.isValidObjectId(data.userId)) return res.status(400).send({status:false,message:"userID is invalid"})
    } 
    if(keys.includes("category")){
        if(!validator.isAlpha(data.category))  return res.status(400).send({status:false,msg:"plz provide valid category value"})
    }
    if(keys.includes("subcategory")){
        if(!validator.isAlpha(data.subcategory))  return res.status(400).send({status:false,msg:"plz provide valid subcategory value"})
    }

    let getBooks = await bookModel.find(data).sort({ title: 1 }).select({ ISBN: 0, isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 })
    if(getBooks.length===0) return res.status(404).send({status:false,message:"book not found"})

    res.status(200).send({status:true,data:getBooks})

    } catch (error) {
        console.log("error in getBooks", error.message);
        res.status(500).send({msg:error.message})
    }

    

}







const getBookById = async function (req, res) {
    try {
        let bookId = req.params.bookId;

        if (!bookId) return res.status(400).send({ msg: "please enter bookId" })
        
        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is not valid" })
        
        let bookData = await bookModel.findById({ _id: bookId, isDeleted: false }).select({__v:0,isDeleted:0}).lean()

        if (!bookData) return res.status(404).send({ msg: "no book found" })
        
        let booksReviews = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ createdAt: 0, updatedAt: 0, isDeleted: 0, __v: 0 })
    
       
        bookData.booksReviews = booksReviews
       
        res.status(200).send({ status: true, message: "Book List", data: bookData })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}





const updateBookById = async (req,res)=>{
    try {
        let data = req.body
        if(Object.keys(data).length===0) return res.status(400).send({status:false,msg:"plz provide valid details for update"})
        let keys = Object.keys(data)
        let bookId = req.params.bookId
        if(keys.includes("reviews") || keys.includes("userId") || keys.includes("isDeleted")) {
            return res.status(400).send({status:false, message:"This fields cannot be updated"})
        }
     
      
        let { title, excerpt, releasedAt, ISBN} = data
        
        if(title){
            if(!validateTitle.test(title.split(" ").join(""))) return res.status(400).send({status:false,message:"plz provide valide title "})
        }
        if(excerpt){
            if(!validateTitle.test(excerpt)) return res.status(400).send({status:false,message:"plz provide valide excerpt"})
        }
        if(releasedAt){
            if(!validator.isDate(releasedAt)) return res.status(400).send({status:false,message:"Invalid date or formate,plz send date in this formate (YYYY/MM/DD) "})
        }
        if(ISBN){
            if(!isbnRegex.test(ISBN)) return res.status(400).send({status:false,message:"plz provide valide regex ISBN"})
        }

        let findDuplicateValue = await bookModel.findOne({$or:[{title:title},{ISBN:ISBN}]})

        if(findDuplicateValue) return res.status(409).send({status:false,message:"given value of ISBN/Title is already exist"})

        let updateData = await bookModel.findOneAndUpdate({_id:bookId,isDeleted:false},data,{new:true})

        if (!updateData) { return res.status(404).send({ status: false, msg: "No books found" }) }

        return res.status(200).send({ status: true, data: updateData })

    } catch (error) {
        console.log("error in updateBook", error.message);
        res.status(500).send({error:error.message})
    }
}









const deleteBookById = async function (req, res) {
    try {
        let bookId = req.params.bookId

        if (!bookId) return res.status(400).send({ status: false, message: "BookId is required." })

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Invalid BookId." })

        let deletedBook = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { isDeleted: true }, { new: true })

        if (!deletedBook) return res.status(404).send({ status: false, message: "Book not found or book is already deleted" })

        res.status(200).send({ status: true, message: " book is deleted " })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}



module.exports = {createBook,getBooks,getBookById,updateBookById,deleteBookById}