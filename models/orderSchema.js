const mongoose=require('mongoose')
const {Schema}=mongoose


const orderSchema=new Schema({
    orderId:{
        type:String,
        default:()=> Math.random().toString(36).substring(2, 10).toUpperCase(),
        unique:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    orderItems:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        },
        totalPrice:{
            type:Number,
            default:0
        }
    }],
    totalAmount:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
     finalAmount:{
        type:Number,
        required:true
     },
     address:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
     },
     invoiceDate:{
        type:Date
     },
     status:{
        type:String,
        required:true,
        enum:["Pending","Shipped","Deliverd","Cancelled"]
     },
     paymentMetherd:{
        type:String,
        required:true,
        enum:['razorpay','cashOnDelivery','wallet']
     },
     couponApp:{
        type:Boolean,
        default:false
     }
},{timestamps:true})

const Order= mongoose.model("Order",orderSchema)
module.exports=Order