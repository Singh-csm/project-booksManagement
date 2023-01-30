const express = require("express")
const  mongoose  = require("mongoose")
mongoose.set('strictQuery', false);
const cors =require("cors")
const route = require("./routes/route.js")



const PORT =  3000

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())

app.use("/", route)

const dbconnection = async ()=>{
   try {
   await mongoose.connect("mongodb+srv://Ashish:7SiSkJ8Z0nkx2EWh@cluster0.8dgrxmt.mongodb.net/group2Database",{useNewUrlParser:true})
    console.log("Database connect");
   } catch (error) {
    console.log("error while db connection", error.message);
   }
}

dbconnection()

app.listen(process.env.PORT ,()=>{
    console.log(`server start on port ${PORT}`);
})