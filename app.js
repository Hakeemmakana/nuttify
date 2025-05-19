const express = require("express")
const app=express()
const nocache =require("nocache")
const path=require("path")
const session=require("express-session")
const passport=require("./config/passport")
const env =require ("dotenv").config();
const Razorpay=require("razorpay")
const db= require ("./config/db")
const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")
db()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(nocache())
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        maxAge:48*60*60*1000
    }
}))

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),,path.join(__dirname,'views/partials')])
app.use(express.static(path.join(__dirname,"public")))

app.use("/uploads", express.static("uploads")); 

app.use("/",userRouter)
app.use("/admin",adminRouter)


app.listen(process.env.PORT,()=>{
    console.log("server started")
})

module.exports=app