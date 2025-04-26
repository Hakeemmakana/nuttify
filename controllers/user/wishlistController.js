const User =require("../../models/userSchema")
const  Wishlist=require("../../models/whishlistSchema")
const Product=require("../../models/productSchema")


const loadWishlist=async(req,res)=>{
    try {
        const userId=req.user._id
        const wishlist=await Wishlist.findOne({userId})
        .populate("products.productId")
        .lean()

console.log(Wishlist.products)



        if(!wishlist){
            return res.status(200).json({wishlist:[],message:"Whislist is empty"})
        }
        // res.status(200).json({wishlist:wishlist.products})
        console.log(wishlist.products)
        const user=req.user
        res.render("wishlist",{
            user:user,
            product:wishlist.products,
            wishlistLength:wishlist.products.length
        })
    } catch (error) {
        console.log("error in wishlist",error)
    }
}

// const addWishlist=async(req,res)=>{
//     try {
//         const userId=req.user._id
//     const {productId}=req.body

//     const product=await Product.findById(productId)
//     if(!product||product.isDeleted){
//         return res.status(404).json({message:"User not found"})
//     }
//     let wishlist =await Wishlist.findOne({userId})
//     if(!wishlist){
//         wishlist=await wishlist({
//             userId,
//             products:[{productId }]
//         })
//     }else{
//         const productAleadyExist=wishlist.products.some(
//             (item)=> item.productId.toString()==productId
//         )
//         if(productAleadyExist){
//             return res.status(400).json({message:"Product already exist in wishlist" })
//         }
//         wishlist.product.push({productId})
//     }
//     await wishlist.save()
//     await User.findByIdAndUpdate(userId,{
//         $addToSet:{wishlist:wishlist._id},
//     })
//     res.status(500).json({message:"Product added to wishlist"})
    
//     } catch (error) {
//         console.log("error in addWishlist page",error)
//     }
// }
const addWishlist=async(req,res)=>{
    console.log("dddddddddd")
    const findUser=await User.findOne({_id:req.user._id})
   try {
    if(!findUser){
        return res.json({
            redirect: '/login',
            msg: 'Session Expired'
          });
    }
    const {productId,currentPageUrl}=req.body
    let wishlist=await Wishlist.findOne({userId:req.user._id}).populate("products.productId")

    if(!wishlist){
        wishlist=new Wishlist({userId:req.user._id,product:[]})
    }
    const product =await Product.findById({_id:productId})
    if(!product){
        // req.session.userMsg="Product is not found"
        // return res.redirct('/shoap')
        return res.json({
            redirect: '/shoap',
            msg: 'Product is not found'
          });
    }
    if (product.isDeleted==true){
        // req.session.userMsg="product is unlisted by seller"
        // return res.redirect("/shoap")
        return res.json({
            redirect: '/shoap',
            msg: 'product is unlisted by seller'
          });
    }
    const existingItem=wishlist.products.find((item)=>{
        return item.productId._id.toString()===productId.toString()
    })
    if(!existingItem){
        wishlist.products.push({
            productId:productId,
        })
    
    await wishlist.save()
    // req.session.userMsg="product added to wishlist"
    // return res.redirect("/wishlist")
    return res.json({
        redirect: '/wishlist',
        msg: 'product added to wishlist'
      });
    }
    // req.session.userMsg="Product already in wishlist"
    // return res.redirct("/wishlist")
    return res.json({
        redirect: '/wishlist',
        msg: 'Product already in wishlis'
      });

    
   } catch (error) {
    console.log("error in add wishlist ",error)
   }

}
module.exports={
    loadWishlist,
    addWishlist,
}