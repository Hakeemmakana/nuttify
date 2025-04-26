const express=require("express")
const router=express.Router()
const passport=require("passport")
const userController=require("../controllers/user/userController")
const profileController=require("../controllers/user/prfileController")
const userProfileController=require("../controllers/user/userProfileController")
const wishlistController=require("../controllers/user/wishlistController")
const cartController=require("../controllers/user/cartController")
const {userAuth,adminAuth}=require("../middlewares/auth")
const addressController = require("../controllers/user/addressController")
const checkoutController = require("../controllers/user/checkoutController")


router.get("/",userController.loadHomepage)
router.get("/shoap",userAuth,userController.loadShoppingPage)
router.get("/filterProduct",userAuth,userController.filterProduct)
router.get("/productDetails",userController.productDetails)
router.get("/account",userAuth,userProfileController.loadProfile)
router.get("/account/orders",userAuth,userProfileController.loadOrders)


router.get("/singup",userController.loadSingup)
router.get("/singin",userController.loadSingin)
router.get("/otpsection",userController.loadOtp)
router.get("/forget-password",profileController.loadforgetPassword)
router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}))
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect:'/singup'}),(req,res)=>{
    req.session.user=req.user
    res.redirect("/")
})
router.get("/pageNotFound",userController.pageNotFound)
router.get("/logout",userController.logout)

router.post("/singup",userController.singup)
router.post("/singin",userController.singin)
router.post("/verifyOtp",userController.verifyOtp)
router.post("/resendOtp",userController.resendOtp)
router.post("/forgetpassword",profileController.forgetPasswordEmail)
router.post("/forgetOtp",profileController.forgetOtp)
router.post("/resetPassword",profileController.resetPassword)


// -----------whislists---------------------
router.get("/wishlist",userAuth,wishlistController.loadWishlist)
router.post("/addToWishlist",userAuth,wishlistController.addWishlist)

// ------------cart-------------------------
router.get("/cart",userAuth,cartController.loadCart)
router.post("/addToCart",userAuth,cartController.addToCart)
router.post("/removeFromCart",userAuth,cartController.removeFromCart)
router.post("/removeCart",userAuth,cartController.removeCart)

// ----------------Address----------
router.get("/account/addresses",userAuth,addressController.loadAddress)
router.post("/add-address",userAuth,addressController.addAddress)
router.post("/edit-address",userAuth,addressController.editAddress)
router.post("/delete-address",userAuth,addressController.deleteAddress)


// -------------prodife edit------------------
router.post('/edit-name',userAuth,userProfileController.editName)

// -----------checkout------------------
router.post('/cartToCheckout',userAuth,checkoutController.cartToCheckout)



module.exports=router