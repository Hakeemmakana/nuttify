
const User =require("../../models/userSchema")
const Cart=require('../../models/cartSchema')
const Product=require("../../models/productSchema")
const Wishlist=require("../../models/whishlistSchema")
const Offer=require("../../models/offerSchama")
const Coupon=require("../../models/coupenSchema")

const loadCart=async(req,res)=>{
    try {
        console.log(req.session.user._id.toString())
        const cart=await Cart.findOne({userId:req.session.user._id}).populate("items.productId")
        .populate({
            path: 'items.productId',
            populate: {
              path: 'category'  // this populates productId.category
            }
          });
          let subTotal=0
                    cart.items.forEach(item=>{
                        subTotal+=item.totalPrice
                    })
        console.log("ddddddddddddddddd")
        cart.items.forEach(item => {
            console.log("Product:", item.productId?.productName);
            console.log("Category:", item.productId?.category?.name);
          });
        const product=cart.items
        const currentDate=new Date()
                const allOffers=await Offer.find({
                    status:'Active',
                    startDate:{$lt:currentDate},
                    endDate:{$gte:currentDate}
                })
                console.log("alllofferssss :",allOffers)

                const result=cart.items.map((item)=>{
                    console.log("itme--",item.productId.category._id)
                    console.log("itmiiiiie--",allOffers[0]._id)
                const offers = allOffers.filter(offer => {
                    const targetId = offer.targetId?.toString();
                    const productId = item.productId._id.toString();
                    const categoryId = item.productId.category._id.toString(); // assuming populated or included
                
                    return (
                        (offer.offerType === 'product' && targetId === productId) ||
                        (offer.offerType === 'category' && targetId === categoryId)
                    );
                });
                console.log("offerssss :",offers)
                const bestOffer = getBestOffer(offers, item);
                return{
                    product:item,
                    bestOffer
                }
            })
        const totalDiscountBF=result.reduce((sum,item)=>{
            const {bestOffer,product}=item
            let discount=0
            if(bestOffer&&bestOffer.discountValue>0){
                discount=(product.totalPrice*bestOffer.discountValue)/100
            }
            return sum+discount
        },0)
            const totalDiscount=Math.floor(totalDiscountBF)
            let couponDiscount=0
            if(req.session.appliedCoupon){
               couponDiscount= Math.floor(((subTotal-totalDiscount)*req.session.appliedCoupon)/100)
                
            }
            let couponCode=''
            if(req.session.appliedCouponName){
                couponCode=req.session.appliedCouponName
            }

            console.log("oooooooooooooooooooo")
            console.log(result)
            console.log(totalDiscount)
        res.render("cart",{
            cart,
            user:req.user,
            totalDiscount,
            couponDiscount,
            couponCode
            
        })
    } catch (error) {
        console.log("error in loadCart",error)
    }
}

const addToCart = async (req,res)=>{
    const userId=req.session.user._id
   
        if(!userId){
            return res.json({
                success:false,
                msg:'session time out plese log in '
            })
        }
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
        return res.json({
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
        
        const cart= await Cart.findOne({userId:req.session.user._id}) 
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
        const findUser = await User.findOne({ _id: req.session.user._id});
    if (!findUser) {
        return res.json({
            redirect: '/login',
            msg: 'Session Expired'
        });
    }

    let cart = await Cart.findOne({ userId:req.session.user._id });
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


const applyCoupon=async (req,res)=>{
    try {
        // console.log(req.body)
        const {couponCode}=req.body
        const coupon=await Coupon.findOne({couponCode:couponCode.trim()})
        console.log(coupon)
      if(!coupon){
        res.json({
            success:false,
            msg:"coupon not available"
        })
      }
      const cart=await Cart.findOne({userId:req.session.user._id}).populate("items.productId")
        .populate({
            path: 'items.productId',
            populate: {
              path: 'category'  // this populates productId.category
            }
          })
          let subTotal=0
          cart.items.forEach(item=>{
              subTotal+=item.totalPrice
          })

      cart.items.forEach(item => {
        console.log("Product:", item.productId?.productName);
        console.log("Category:", item.productId?.category?.name);
      });
    const product=cart.items
    const currentDate=new Date()
            const allOffers=await Offer.find({
                status:'Active',
                startDate:{$lt:currentDate},
                endDate:{$gte:currentDate}
            })
            console.log("alllofferssss :",allOffers)

            const result=cart.items.map((item)=>{
                console.log("itme--",item.productId.category._id)
                console.log("itmiiiiie--",allOffers[0]._id)
            const offers = allOffers.filter(offer => {
                const targetId = offer.targetId?.toString();
                const productId = item.productId._id.toString();
                const categoryId = item.productId.category._id.toString(); // assuming populated or included
            
                return (
                    (offer.offerType === 'product' && targetId === productId) ||
                    (offer.offerType === 'category' && targetId === categoryId)
                );
            });
            console.log("offerssss :",offers)
            const bestOffer = getBestOffer(offers, item);
            return{
                product:item,
                bestOffer
            }
        })
    const totalDiscountBF=result.reduce((sum,item)=>{
        const {bestOffer,product}=item
        let discount=0
        if(bestOffer&&bestOffer.discountValue>0){
            discount=(product.totalPrice*bestOffer.discountValue)/100
        }
        return sum+discount
    },0)
        const totalDiscount=Math.floor(totalDiscountBF)
       
        if(coupon.minPurchase>(subTotal-totalDiscount)){
            return res.json({
                sucess:false,
                msg:'minimum purchase not reached'
            })
        }


      req.session.appliedCoupon=coupon.discountValue
      req.session.appliedCouponName=coupon.couponCode
      res.json({
        success:true,
        msg:"coupen applied successfully"
      })
    } catch (error) {
        console.log("errro in applyCoupon ",error)
    }
}

const removeCoupon= async(req,res)=>{
    try {
        console.log(req.body)
        req.session.appliedCoupon=null
        req.session.appliedCouponName=''
        res.json({
            success:true,
            msg:"coupen removed successfully"
        })
    } catch (error) {
        console.log("error i  remove coupon",error)
    }
}
const showCoupons=async(req,res)=>{
try {
    const coupon=await Coupon.find({status:'Active'})

    res.render('showCoupons',{
        coupon
})
    console.log("lllllllllllll",coupon)
} catch (error) {
    console.log("error in show coupon",error)
}

}

function getBestOffer(applicableOffers, product) {
    if (!Array.isArray(applicableOffers) || applicableOffers.length === 0) return null;
  
    let bestOffer = null;
    let maxDiscount = 0;
  
    const price = product.price || product.regularPrice || 0;
  
    if (price <= 0) {
      console.log(`Invalid price for product: ${product.productName}`);
      return null;
    }
  
    for (const offer of applicableOffers) {
      const discount = (price * offer.discountValue) / 100;
  
      if (discount < price && discount > maxDiscount) {
        maxDiscount = discount;
        bestOffer = offer;
      }
    }
  
    return bestOffer;
  }

module.exports={
    loadCart,
    addToCart,
    removeFromCart,
    removeCart,
    applyCoupon,
    removeCoupon,
    showCoupons
}