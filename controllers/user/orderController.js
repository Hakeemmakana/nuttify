const User =require("../../models/userSchema")
const Order =require("../../models/orderSchema")
const Product=require("../../models/productSchema")

const loadOrders=async(req,res)=>{

    try {
        if(!req.session.user){
            res.reditect("/singup")
        }

        
        let search =""
        if(req.query.search){
            search=req.query.search
        }
        
        const page =parseInt(req.query.page)||1
        const limit =4
        const skip=(page-1)*limit
    //    console.log("userin ord", req.user._id)
        const order=await Order.find({
            userId:req.user._id,
            $or: [
                { orderId: { $regex: search, $options: "i" } },
            ]
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('orderItems.productId')
        .populate('userId')

        console.log(order)

        
        if(!order){
            
            msg='Cart is Empty'
        }
        // console.log("order",order)

        const count=await Order.find({$or: [
            { orderId: { $regex: search, $options: "i" } },
                ]}).countDocuments()
                const totalCategories=count
                const totalPages = Math.ceil(count/limit)
                const startItem = skip + 1;
                const endItem = Math.min(skip + limit, count);
        res.render("orders",{
            order,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            startItem:startItem,
            endItem:endItem,
            search:search,
            
        })
        
    } catch (error) {
        
    }
}
const loadOrederDetails=async(req,res)=>{
    try {
         const id=req.query.id
            const order= await Order.findById(id).populate('orderItems.productId')
            // console.log(order)
            if(!order){
                return res.json({
                    success:false,
                    msg:"not order as per id"
                })
            }
            return res.render("orderDetailsPage",{
                order
            })
    } catch (error) {
        console.log("error in loadOrderDetails page",error)
    }
}
const cancelOrder=async (req,res)=>{
    console.log("lllllllllllll")
    console.log(req.body)
    const {status,orderId,reason}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Cancelled'){
            return res.json({
                success:false,
                msg:'plese choose valid status'
            })
        }
        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }

        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        // console.log("fjjjjjf",order)
        order.status=status
        order.cancelReason=reason
        await order.save()
        for(let item of order.orderItems){
            const product=await Product.findById(item.productId)
            if(product){
                product.stock+=item.quantity
                await product.save()
            }
        }
        res.json({
            success:true,
            msg:'Order cancelled successfully'
        })
    } catch (error) {
        console.log("error in cancelOrder ",error)
    }
}
const returnRequestOrder=async (req,res)=>{
    const {status,orderId,reason}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Return-requested'){
            return res.json({
                success:false,
                msg:'plese choose valid request'
            })
        }
        if(order.status=='Cancelled'){
            // console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already  cancelled"
            })
        }
        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        order.status=status
        order.returnReason=reason
        await order.save()
        res.json({
            success:true,
            msg:'requested for return'
        })


    } catch (error) {
        console.log("error in return order page",error)
    }
   
}

const cancelProduct=async(req,res)=>{
    console.log("cancell product",req.body)
    const {status,orderId,reason,productId}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Cancelled'){
            return res.json({
                success:false,
                msg:'plese choose valid status'
            })
        }
        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }

        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        

        const item=order.orderItems.find(item=>item.productId.toString()==productId)
        // console.log("fjjjjjf",item)
        if(!item){
            res.json({
                success:false,
                msg:'product not found'
            })
        }

        if(item.status=='Deliverd'||item.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"product already delivered or cancelled"
            })
        }

        item.status=status
        item.cancelReason=reason
        await order.save()
        const product= await Product.findById(item.productId)
        if(product){
            product.stock+=item.quantity
            await product.save()
        }

        const allItemCancelled= order.orderItems.every(item=> item.status=='Cancelled')

        if(allItemCancelled){
            order.status='Cancelled'
            await order.save()
        }

        res.json({
            success:true,
            msg:'product cancelled successfully'
        })

    } catch (error) {
        console.log("error in cancellProduct ",error)
        
    }
}

const returnRequestProduct=async(req,res)=>{
    const {status,orderId,reason,productId}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Return-requested'){
            return res.json({
                success:false,
                msg:'plese choose valid request'
            })
        }
        if(order.status=='Return-requested'){
            // console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already  cancelled"
            })
        }
        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        
        const item=order.orderItems.find(item=>item.productId.toString()==productId)
        // console.log("fjjjjjf",item)
        if(!item){
            res.json({
                success:false,
                msg:'product not found'
            })
        }

        if(order.status!=='Deliverd'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"product not delivered "
            })
        }

        item.status=status
        item.returnReason=reason
        await order.save()

        res.json({
            success:true,
            msg:'requested for return'
        })


    } catch (error) {
        console.log("error in return product page",error)
    }
   
}


module.exports={
    loadOrders,
    loadOrederDetails,
    cancelOrder,
    returnRequestOrder,
    cancelProduct,
    returnRequestProduct
   
    
}