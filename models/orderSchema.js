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
        },
        status:{
            type:String,
            required:false,
            enum:["Processing","Shipped","Deliverd","Cancelled","Returned","Return-requested"] 
        },
        cancelReason: {
            type: String,
        },
        returnReason: {
            type: String,
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
        name: { type: String, required: true },
        phone: { type: String, required: true },
        pincode: { type: String, required: true },
        postOffice: { type: String, required: true },
        address: { type: String, required: true },
        district: { type: String, required: true },
        state: { type: String, required: true },
        altPhone: { type: String },
        addressType: { type: String, enum: ['home', 'office'], default: 'home' }
     },
     invoiceDate:{
        type:Date
     },
     status:{
        type:String,
        required:true,
        enum:["Processing","Shipped","Deliverd","Cancelled","Returned","Return-requested"]
     },
     cancelReason: {
        type: String,
        
    },
    returnReason: {
        type: String,
        
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