const mongoose=require(mongoose)
const {Schema}=mongoose
const {v4:uuidv4}=require("uuid")

const orderSchema=new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderItems:[{
        product:{
            type:Schema.Type.ObjectId,
            ref:"product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice:{
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
        type:Schema.Type.ObjectId,
        ref:"user",
        required:true
     },
     invoiceDate:{
        type:Date
     },
     status:{
        type:string,
        required:true,
        enum:["Pending","Processing","Shipped","Deliverd","Cancelled"]
     },
     createdOn:{
        type:Date,
        defalt:Date.now,
        required:true
     },
     couponApp:{
        type:Boolean,
        default:false
     }
})

const Order= mongoose.model("Order",orderSchema)
module.exports=Order