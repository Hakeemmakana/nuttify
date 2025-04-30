

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
            address
            
            
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
       const cartAddress = address.address.find(item=>item._id.toString()==addressId.toString())
        console.log(cartAddress)
       if(!cartAddress){
            return res.json({
                success:false,
                msg:'address not exist'
            })
       }

       

    //    let address = {

    //    }
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
        address:cartAddress,
        paymentMetherd:paymentOption,
        finalAmount:totalAmount,
        status:'Pending'
       })
       await newOrder.save()
       req.session.orderSuccess=true
       
       res.json({
        success:true,
        msg:'order compleated suceesfully ',
        redirectUrl: '/orderSuccess'
    })

    // return res.render("orderSuccess")
    } catch (error) {
        console.log("error in checkout page",error)
    }
   
}

const orderSuccess=async (req, res) => {
    console.log(req.user._id)
    const order= await Order.findOne({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('orderItems.productId')
    
    console.log(order)
    
    if (req.session.orderSuccess) {
        req.session.orderSuccess = false; 
        
        return res.render('orderSuccess',{
            order
        });  
    } else {
        return res.redirect('/'); 
    }
};
module.exports={
    loadCheckout,
    checkout,
    orderSuccess
}