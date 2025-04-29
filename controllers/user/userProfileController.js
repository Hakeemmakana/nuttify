const User =require("../../models/userSchema")

const loadProfile=async (req,res)=>{
    try {
        if(!req.session.user){
            res.redirect("/singin")
        }
       const user= await User.findOne({_id:req.session.user._id})
        // console.log(user)
        
        res.render("profile",{
            user
        })
    } catch (error) {
        
    }
}
const loadOrders=async(req,res)=>{
    try {
        res.render("orders",{
            
        })
        
    } catch (error) {
        
    }
}
const editName=async(req,res)=>{
    // console.log("llllllllllllllll")
    // console.log(req.body)
    try {
        const {id,name}=req.body
        const findus=await User.findOneAndUpdate(
            {_id:req.user._id},
            {$set:{
                name:name
            }}
        )
        if(!findus){
            res.send({
                success:false,
                msg:'session timout'
            })
        }
        res.json({
            success:true,
            msg:"edited sucssessfully"
        })
    } catch (error) {
        console.log("error in edit name ",error)
    }
   
}
const changePassword=async(req,res)=>{
    
}



module.exports={
    loadProfile,
    loadOrders,
    editName,
    changePassword
    
}