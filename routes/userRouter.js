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
const orderController=require("../controllers/user/orderController")
const reportCotroller=require("../controllers/admin/reportController")


router.get("/",userController.loadHomepage)
router.get("/shoap",userAuth,userController.loadShoppingPage)
router.get("/filterProduct",userAuth,userController.filterProduct)
router.get("/productDetails",userController.productDetails)
router.get("/account",userAuth,userProfileController.loadProfile)


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
router.post("/removeFromWishlist",userAuth,wishlistController.removeFromWishlist)

// ------------cart-------------------------
router.get("/cart",userAuth,cartController.loadCart)
router.post("/addToCart",userAuth,cartController.addToCart)
router.post("/removeFromCart",userAuth,cartController.removeFromCart)
router.post("/removeCart",userAuth,cartController.removeCart)
router.post("/applyCoupon",userAuth,cartController.applyCoupon)
router.post("/removeCoupon",userAuth,cartController.removeCoupon)
router.get("/showCoupons",userAuth,cartController.showCoupons)


// ----------------Address----------
router.get("/account/addresses",userAuth,addressController.loadAddress)
router.post("/add-address",userAuth,addressController.addAddress)
router.post("/edit-address",userAuth,addressController.editAddress)
router.post("/delete-address",userAuth,addressController.deleteAddress)


// -------------prodife edit------------------
router.post('/edit-name',userAuth,userProfileController.editName)
router.get('/changePassword',userAuth,userProfileController.changePassword)


//-------wallet------------
router.get('/wallet',userAuth,userProfileController.loadWallet)

// -----------checkout------------------
router.get('/checkout',userAuth,checkoutController.loadCheckout)
router.post('/checkout',userAuth,checkoutController.checkout)
router.post("/verifyPayment",userAuth,checkoutController.verifyPayment)
router.post("/payment-failed",userAuth,checkoutController.paymentFailed)
router.get('/orderSuccess', userAuth,checkoutController.orderSuccess)
router.get('/orderFailed', userAuth,checkoutController.orderFailed)
router.post('/retryPayment',userAuth,checkoutController.retryPayment)
router.post('/verifyRetryPayment',userAuth,checkoutController.verifyRetryPayment)

//-----------------order---------------------------
router.get("/account/orders",userAuth,orderController.loadOrders)
router.get('/account/orderDetails',userAuth,orderController.loadOrederDetails)
router.post("/account/cancelOrder",userAuth,orderController.cancelOrder)
router.post("/account/returnRequestOrder",userAuth,orderController.returnRequestOrder)
router.get("/account/orders/downloadInvoice",userAuth,orderController.downloadInvoice)

// -----------------productOrder--------
router.post("/account/cancelProduct",userAuth,orderController.cancelProduct)
router.post("/account/returnRequestProduct",userAuth,orderController.returnRequestProduct)

//-------------repport------------
router.get('/api/reports/excel',reportCotroller.downloadExcel)
router.get('/api/reports/pdf',reportCotroller.downloadPDF)



module.exports=router