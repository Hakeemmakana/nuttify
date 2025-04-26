const mongoos=require("mongoose")
const{Schema}=mongoose
const couponSchema=new schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Number,
        required:true,
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:Schema.Type.objectId,
        ref:"user"
    }]
})

const Coupon=mongoose.model("Coupon",couponSchema)
module.exports=Coupon