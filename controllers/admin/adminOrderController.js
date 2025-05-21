
const Order=require('../../models/orderSchema')
const Product=require('../../models/productSchema')
const Wallet =require("../../models/walletSchema")

const loadOrders= async (req,res)=>{
    try {

        let search =""
        if(req.query.search){
            search=req.query.search
        }
        
        const page =parseInt(req.query.page)||1
        const limit =4
        const skip=(page-1)*limit

        const order=await Order.find({$or: [
            { orderId: { $regex: search, $options: "i" } },
        ]})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('orderItems.productId')
        .populate('userId')
        console.log(order)

        const count=await Order.find({$or: [
            { orderId: { $regex: search, $options: "i" } },
        ]}).countDocuments()

        const totalCategories=count
        const totalPages = Math.ceil(count/limit)
        const startItem = skip + 1;
        const endItem = Math.min(skip + limit, count);
        res.render("adminOrders",{
            order,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            startItem:startItem,
            endItem:endItem,
            search:search,
        })

    } catch (error) {
        console.log("error in loadOrders",error)
    }
}

const editOrder=async(req,res)=>{
    const id=req.query.id
    const order= await Order.findById(id).populate('orderItems.productId')
    console.log(order)
    if(!order){
        return res.json({
            success:false,
            msg:"not order as per id"
        })
    }
    return res.render("adminOrdersEdit",{
        order
    })

}
const orderStatusChange=async (req,res)=>{
    console.log(req.body)
    const {status,orderId}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }
        console.log("fjjjjjf",order)
        order.status=status
        await order.save()

        res.json({
            success:true,
            msg:'order status updated successfully'
        })

    } catch (error) {
        console.log("error in orderStatusChange",error)
    }
}

const returnedOrder=async (req,res)=>{
    try {
    const {status,orderId}=req.body
    const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }        

        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }
        if(status!=='Returned'){
            // console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"invalid input "
            })
        }
        order.status=status
        await order.save()
        let refundAmount=0
        for(let item of order.orderItems){
            if(item.status!=='Cancelled'||item.status!=='Returned'){
                refundAmount+=(item.totalPrice-item.totalDiscount)
            const product=await Product.findById(item.productId)
            if(product){
                product.stock+=item.quantity 
                await product.save()
            }
        }
        }
        res.json({
            success:true,
            msg:'order status updated successfully'
        })
        const userId=order.userId
        let wallet= await Wallet.findOne({userId})
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: refundAmount,
                transactions: [{
                    amount: refundAmount,
                    type: 'Credit',
                    method: 'Refund',
                    orderId: orderId, // If available
                    date: new Date()
                }]
            });
        } else {
            wallet.balance += refundAmount;
            wallet.transactions.push({
                amount: refundAmount,
                type: 'Credit',
                method: 'Refund',
                orderId: orderId, 
                date: new Date()
            });
        }


    } catch (error) {
        console.log("error in returned order page ",error)
        
    }
}
const productReturn=async(req,res)=>{
    try {
        console.log("ddddddddddd",req.body)
        // return res.status(200).json({ success: true, msg:'jkdfkjdkfjkdj'});      
        const {orderId,productId}=req.body

const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(order.status=='Returned'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }
        console.log("jjjjjjj",order)
        const item=order.orderItems.find(item=>item.productId.toString()==productId)
        if(!item){
            return res.json({
                success:false,
                msg:"prodcut not found"
            })
        }

        if(item.status=='Returned'){
            return res.json({
                success:false,
                msg:"product already returnd"
            })
        }
        item.status="Returned"
        await order.save()
       
        const product =await Product.findById(item.productId)
        if(product){
            product.stock+=item.quantity
            await product.save()
        }

         let refundAmount= (item.totalPrice-item.totalDiscount)
                
                let wallet= await Wallet.findOne({userId})
                if (!wallet) {
                    wallet = new Wallet({
                        userId,
                        balance: refundAmount,
                        transactions: [{
                            amount: refundAmount,
                            type: 'Credit',
                            method: 'Refund',
                            orderId: orderId, // If available
                            date: new Date()
                        }]
                    });
                } else {
                    wallet.balance += refundAmount;
                    wallet.transactions.push({
                        amount: refundAmount,
                        type: 'Credit',
                        method: 'Refund',
                        orderId: orderId, 
                        date: new Date()
                    });
                }
                await wallet.save()
        const allItemReterned=order.orderItems.every(item=>item.status=='Returned')
        if(allItemReterned){
            order.status="Returned"
            await order.save()
        }
        res.json({
            success:true,
            msg:'product return approved '
        })
    } catch (error) {
        console.log("error in product return page",error)
    }
}
module.exports={
    loadOrders,
    editOrder,
    orderStatusChange,
    returnedOrder,
    productReturn
}