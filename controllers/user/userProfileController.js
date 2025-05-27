const User =require("../../models/userSchema")
const Order =require("../../models/orderSchema")
const Product=require("../../models/productSchema")
const Wallet=require("../../models/walletSchema")

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

const editName=async(req,res)=>{
    // console.log("llllllllllllllll")
    // console.log(req.body)
    try {
        const {id,name}=req.body
        const findus=await User.findOneAndUpdate(
            {_id:req.session.user._id},
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

const loadWallet=async (req,res)=>{
    try {
        let page =1
        if(req.query.page){
            page=parseInt(req.query.page)
        }
        const limit=8
        const skip=(page-1)*limit
    
        const wallet=await Wallet.findOne(
            {userId:req.session.user._id},
            {transactions:{$slice:[skip,limit]}}
        )
        if(!wallet){
            return res.render("wallet",{
                wallet:{balance:0,
                    transactions:[]
                },
                currentPage:page,
                totalTransaction:1,
                totalPages:1,
                startItem:1,
                endItem:1
            })
        }
        const wallets=await Wallet.findOne({userId:req.session.user._id})
        const count =wallets.transactions.length
        // console.log(wallet)
        const totalTransaction=count
        const totalPages=Math.ceil(count/limit)
        const startItem=skip+1
        const endItem=Math.min(skip+limit,count)

        res.render("wallet",{
            wallet,
            currentPage:page,
            totalTransaction,
            totalPages,
            startItem,
            endItem
        })
    } catch (error) {
        console.log("error in wallet",error)
    }
}


module.exports={
    loadProfile,
    editName,
    changePassword,
    loadWallet
    
}