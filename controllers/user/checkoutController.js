

const Address = require("../../models/addressSchema")
const Cart =require("../../models/cartSchema")
const Product=require("../../models/productSchema")
const Order=require('../../models/orderSchema')


const loadCheckout=async (req,res) =>{
    try {
        if(!req.session.user){
            res.json({
                success:false,
                msg:'session expired'
            })
        }
        const cart=await Cart.findOne({userId:req.user._id}).populate('items.productId')
        
        if(!cart||cart.items.length==0){
            return res.render("checkout",{
                msg:'cart is empty'
            })
        }
        cart.items.forEach(item=>{
            if(item.productId.stock<item.stock){
                return res.render('chekout',{
                    msg:"quntity exeed stock"
                })
            }

        })
        
        const address= await Address.findOne({userId:req.user._id})
        // console .log("checkout address",address)
        res.render("checkout",{
            cart,
            address,
            
            
        })
    } catch (error) {
        console.log("error in chekout page",error)
    }


    
}


const checkout =async(req,res)=>{
 const {addressId,paymentOption}=req.body
    try {
        
        if(!req.session.user){
           return res.json({
                success:false,
                msg:'session expired'
            })
        }
        
        const address= await Address.findOne({userId:req.user._id})
       const cartAddress= address.address.find(item=>item._id.toString()==addressId.toString())
    //    console.log(cartAddress)
       if(!cartAddress){
       
        return res.json({
            success:false,
            msg:'address not exist'
        })
       }
       const cart=await Cart.findOne({userId:req.user._id}).populate('items.productId')
       cart.items.forEach(item=>{
        if(item.productId.stock<item.quantity){
            return res.json({
                success:false,
                msg:'quntity exeed in product stock'
            })
        }
       })
       if(!(paymentOption=='razorpay'||paymentOption=='cashOnDelivery'||paymentOption=='wallet')){
        return res.json({
            success:false,
            msg:'plese select a valid payment option'
        })
       }

       let totalAmount=0
       cart.items.forEach(items=>{
         totalAmount+=items.totalPrice
       })
       console.log("fffffffff",totalAmount)
       const newOrder =new Order({
        userId:req.user._id,
        orderItems:cart.items.map(cartItems=>({
            productId:cartItems.productId,
            quantity:cartItems.quantity,
            price:cartItems.price,
            totalPrice:cartItems.totalPrice
        })),
        totalAmount:totalAmount,
        address:cartAddress._id,
        paymentMetherd:paymentOption,
        finalAmount:totalAmount,
        status:'Pending'
       })
       await newOrder.save()
       
       return res.json({
        success:true,
        msg:'order compleated suceesfully '
    })

    } catch (error) {
        console.log("error in checkout page",error)
    }
   
}
module.exports={
    loadCheckout,
    checkout
}