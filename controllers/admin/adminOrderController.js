
const Order=require('../../models/orderSchema')
const Product=require('../../models/productSchema')

const loadOrders= async (req,res)=>{
    try {
        console.log(req.use)
        const order=await Order.find()
        .populate('orderItems.productId')
        .populate('userId')
        console.log(order)
        res.render("adminOrders",{
            order,
        })

    } catch (error) {
        console.log("error in loadOrders",error)
    }
}
module.exports={
    loadOrders
}