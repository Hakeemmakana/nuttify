const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const {userAuth,adminAuth}=require("../middlewares/auth")
const customerController=require("../controllers/admin/customerController")
const CategoryController = require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const adminOrderController=require('../controllers/admin/adminOrderController')

router.get("/login",adminController.loadLogin)
router.get("/",adminAuth,adminController.loadDashboard)
router.post("/logout",adminController.logout)
router.get("/pageError",adminController.pageError)
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

router.post("/login",adminController.login)







module.exports=router