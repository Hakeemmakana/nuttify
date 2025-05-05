
const User =require("../../models/userSchema")
const Cart=require('../../models/cartSchema')
const Product=require("../../models/productSchema")
const Wishlist=require("../../models/whishlistSchema")

const loadCart=async(req,res)=>{
    try {
        console.log(req.user._id.toString())
        const cart=await Cart.findOne({userId:req.user._id}).populate("items.productId")
        
        res.render("cart",{
            cart,
            user:req.user
            
        })
    } catch (error) {
        console.log("error in loadCart",error)
    }
}

const addToCart = async (req,res)=>{
    const userId=req.user._id
try {
    const {productId,quantity}=req.body
  console.log(req.body)
    const findUser=User.findOne({_id:userId})
    if(!findUser){
        return res.json({
            redirect:'/login',
            success:false,
            msg:'Session Expired'
        })
    }
    const product = await Product.findById(productId).populate("category")
    if(!product||product.status=="UnListed"||product.category.isListed=="false"){
        return res.json({
            redirect:'/shoap',
            success:false,
            msg:"Product Cannot be added due to block or unlisted status"
        })
    }
let cart = await Cart.findOne({userId})
if(!cart){
    cart =new Cart({userId,items:[]})
// console.log("-------------------------------44-")

}
// console.log("--------------------------------49--")

const existingItem =cart.items.find(item=>item.productId.toString()==productId)
if(existingItem){
    // console.log("--------------------------------49")
console.log(existingItem)
    const newQuantity=existingItem.quantity+parseInt(quantity)
    // console.log("newwnt",newQuantity)
    if(newQuantity>product.stock){

        return res.json({
            redirect:'/cart',
            success:false,
            msg:'Quantitty exceeds available stock'
        })
    }

    const maxQntyPerProduct=10
    if(newQuantity>maxQntyPerProduct){
        return res.json({
            redirct:'/cart',
            success:false,
            msg:`Maximum quantity per product is ${maxQntyPerProduct}`
        })
    }
// console.log("--------------------------------58")

    existingItem.quantity=newQuantity
    existingItem.totalPrice=product.regularPrice*newQuantity
}else{
    if(quantity>product.stock){
        returnres.json({
            redirect:'/cart',
            success:false,
            msg:"Quantity exeeds more than stock"
        })
    }
    if(quantity>10){
        return res.json({
            redirect:"/cart",
            success:false,
            msg:"maximum quantiey is 10"
        })
    }

cart.items.push({
    productId,
    quantity,
    price:product.regularPrice,
    totalPrice:product.regularPrice*quantity,

})
console.log(cart.items)
  
}
await Wishlist.findOneAndUpdate(
    {userId},
    {$pull:{products:{productId}}}
)
    await cart.save()
    return res.json({
        redirect:'/cart',
        success:true,
        msg:"product added to cart successfully"
    })
} catch (error) {
        console.log("error in addToCart ",error)
        
}
}

const removeFromCart=async (req,res)=>{
    const {productId}=req.body
    try {
        
        const cart= await Cart.findOne({userId:req.user._id}) 
        if(!cart){
            return res.json({
                sucsses:false,msg:"cart dosent exisist"
            })
        }
       const cartItem=cart.items.find(item=>item.productId.toString()==productId)
        if(!cartItem){
            return res.json({
                success:false,msg:"product not in cart"
            })
        }
        if(cartItem.quantity==1){
            return res.json({
                sucsses:false,
                msg:"Quantity must be atleast 1"
            })
        }
        cartItem.quantity=cartItem.quantity-1
        cartItem.totalPrice=cartItem.price*cartItem.quantity
        await cart.save()
        return res.json({
            success:true,
            msg:"cart item has dicreased"
        })
    } catch (error) {
        console.log("error in remove frorm cart",error)
        
    }
}



const removeCart =async (req,res)=>{
    

    const{productId}=req.body


    try {
        const findUser = await User.findOne({ _id: req.user._id });
    if (!findUser) {
        return res.json({
            redirect: '/login',
            msg: 'Session Expired'
        });
    }

    let cart = await Cart.findOne({ userId:req.user._id });
    if (!cart) {
        return res.json({
            redirect: '/cart',
            msg: 'Cart  is not found.'
        });
    }

    const cartLength = cart.items.length;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    // console.log(cart)
    if (cart.items.length === cartLength) {
        return res.json({
            redirect: '/cart',
            msg: 'Product not found in cart.'
        });
    }

    await cart.save();
    return res.json({
        success:true,
        redirect: '/cart',
        msg: 'Product removed in cart'
    });
    } catch (error) {
        console.log("error in removecart",error )
    }
}


module.exports={
    loadCart,
    addToCart,
    removeFromCart,
    removeCart
}