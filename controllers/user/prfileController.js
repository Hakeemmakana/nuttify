const User=require("../../models/userSchema")
const nodemailer =require("nodemailer")
const bcrypt= require("bcrypt")
const env= require("dotenv").config()
const session= require("express-session")

function generateOtp(){
    const digits="1234567890"
    let otp= ""
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp
}

const sendVerificationEmail=async (email,otp)=>{
    try {
        
        const transporter=nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            auth:{
                user:process.env.EMAIL,
                pass:process.env.EMAIL_PASSWORD
            }
        })

        const mailOptions={
            from:process.env.EMAIL,
            to:email,
            subject:"Your OTP for password reset",
            text:`Your OTP is ${otp}`,
            html:`<b><h4>Your OTP ${otp}</h4></b>`
        }
        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent :",info.messageId);
        return true
    } catch (error) {
        console.log("error sending in emil forget",error)
    }
}

const loadforgetPassword=async(req,res)=>{
    try {
        res.render("forgetpassword",{message:""})
    } catch (error) {
        console.log("error in loadforgetpassword",error)
    }
}

const forgetPasswordEmail= async(req,res)=>{
    try {
        const {email}=req.body
        const findUser=await User.findOne({email:email})
        if(findUser){
            const otp =generateOtp()
            const emailSent=await sendVerificationEmail(email,otp)
        
        
        if(emailSent){
            req.session.userOtp=otp
            req.session.email= email
            res.render("forgetpasswordotp")
            console.log("OTP:",otp)
            return
        }else{
            res.json({success:false,message:"Failed to send OTP,plese try again "})
            
        }
    }else{
        res.render("forgetpassword",{
            message:"User With this email does not exist "
        })
    }
    } catch (error) {
        console.log("error in forgetPassword",error)

    }
}

const forgetOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (otp === req.session.userOtp) {

            req.session.userOtp = null;
            return res.render("createnewpass");
        } else {
            return res.render("forgetpasswordotp", { messageOtp: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.log("error in forgetOtp", error);
        return res.render("forgetpasswordotp", { message: "An error occurred. Please try again." });
    }
};

const resetPassword=async(req,res)=>{
    try {
        const {password,cpassword}=req.body
    if(!password||password.length<8){
        return res.render("createnewpass",{message:"Password must be at least 8 characters long."})
    }
    if(password!==cpassword){
        return res.render("createnewpass",{ message: "Passwords do not match." })
    }

    const saltRounds=10
    const hashedPassword=await bcrypt.hash(password,saltRounds)

   await User.findOneAndUpdate(
        {email:req.session.email},
        {$set:{password:hashedPassword}}
    )
    req.session.userOtp=null
    req.session.email=null
    res.render("singin",{ messageSucsess: "Password reset successfully. Please log in with your new password." })
    } catch (error) {
        console.log("error in resetPassword",error)
        res.render("createnewpass", { message: "An error occurred. Please try again." });
        
    }
}

module.exports={
    loadforgetPassword,
    forgetPasswordEmail,
    forgetOtp,
    resetPassword,
    
}