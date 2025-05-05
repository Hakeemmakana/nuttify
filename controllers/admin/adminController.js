const User = require("../../models/userSchema")
const mongoose=require("mongoose")
const bcrypt= require("bcrypt")

const loadLogin=async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin")
        }
       return res.render("loginsection/login")
    } catch (error) {
        console.log("load login error ",error)
    }
}
const login=async (req,res)=>{
    try {
        const{email,password}=req.body
        if(req.session.admin){
            return res.redirect("/admin")}
        const admin=await User.findOne({email,isAdmin:true})
        if(!admin){
            return res.redirect("/admin/login")
        }
        const passwordMatch=await bcrypt.compare(password,admin.password)
        if(passwordMatch){
            req.session.admin=true
            return res.redirect("/admin")
        }else{
            return res.redirect("/login")
        }
    } catch (error) {
        console.log("error in admin login",error)
        return res.redirect("/pageError")
    }
}

const loadDashboard= async (req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashboard")
        } catch (error) {
            console.log(error)
            res.redirect("/pageError")
        }
    }
}

const logout =async (req,res)=>{
   try {
    req.session.destroy((err)=>{
        if(err){
            console.log("error in session destroy",err)
            return res.status(500).send("Error logging out.")
        }
        res.redirect("/admin/login")
        
    })
    
} catch (error) {
    console.log("error in logout",error)
    return res.status(500).send("Internal server error.");
   }
}
const pageError=async (req,res)=>{
    try {
       res.render("admin/pageError") 
    } catch (error) {
        console.log("error in pageError",error)
    }
}






module.exports={
    loadLogin,
    login,
    loadDashboard,
    logout,
    pageError,

}
