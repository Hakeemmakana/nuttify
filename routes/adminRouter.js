const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const {userAuth,adminAuth}=require("../middlewares/auth")
const customerController=require("../controllers/admin/customerController")
const CategoryController = require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const adminOrderController=require('../controllers/admin/adminOrderController')
const couponController=require("../controllers/admin/couponController")
const offerController=require("../controllers/admin/offerController")

router.get("/login",adminController.loadLogin)
router.get("/",adminAuth,adminController.loadDashboard)
router.post("/logout",adminController.logout)
router.get("/pageError",adminController.pageError)
router.get("/reports",adminAuth,adminController.loadSalesReport)
router.post("/salesReport",adminAuth,adminController.salesReport)
//User Management
router.get("/users",adminAuth,customerController.customerInfo)
router.post("/blockCustomer",adminAuth,customerController.blockCustomer)
router.get("/unblockCustomer",adminAuth,customerController.unblockCustomer)
//Cateory Management
router.get("/category",adminAuth,CategoryController.categoryInfo)
router.post("/addCategory",adminAuth,CategoryController.addCategory)
router.post("/editCategory",adminAuth,CategoryController.editCategory)
router.post("/deleteCategory",adminAuth,CategoryController.deleteCategory)
//product Management 
router.get("/products",adminAuth,productController.loadProduct)
router.post("/addProduct", adminAuth, productController.addProduct)
router.post("/editProduct",adminAuth,productController.editProduct)
router.post("/deleteProduct",adminAuth,productController.deleteProduct)
//order Management
router.get("/orders",adminAuth,adminOrderController.loadOrders)
router.get("/orderEdit",adminAuth,adminOrderController.editOrder)
router.post("/orderStatusChange",adminAuth,adminOrderController.orderStatusChange)
router.post ("/returnedOrder",adminAuth,adminOrderController.returnedOrder)
router.post ("/ProductReturn",adminAuth,adminOrderController.productReturn)

//coupen Mangement
router.get("/coupons",adminAuth,couponController.loadCoupon)
router.post("/add-coupon",adminAuth,couponController.addCoupon)
router.post("/edit-coupon",adminAuth,couponController.editCoupon)
router.post("/delete-coupon",adminAuth,couponController.deleteCoupon)

//offer Management
router.get("/offers",adminAuth,offerController.loadOffer)
router.get("/viewEditOffer/:id",adminAuth,offerController.viewEditOffer)
router.post("/add-offer",adminAuth,offerController.addOffer)
router.post("/edit-offer",adminAuth,offerController.editOffer)
router.post("/delete-offer",adminAuth,offerController.deleteOffer)


// router.post("/sales-report",adminAuth,adminController.salesReport)

router.post("/login",adminController.login)





module.exports=router