const mongoose=require("mongoose")
const {Schema}=mongoose

const productSchema= new Schema({
    productName:{
        type:String,
        required:true
    },
    productDescription:{
        type:String,
        required:true
    },
    // brand:{
    //     type:String,
    //     required:true
    // }
    // ,
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:false//true
    },
    productOffer:{
        type:Number,
        default:0
    },
    quantity:{
        type:Number,
        default:true
    },
    productImage:{
        type:[String],
        required:true
    },
    varient:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Listed","UnListed"],
        required:true,
        default:"Listed"
    }

},{timestamps:true})

const product =mongoose.model("Product",productSchema)
module.exports=product;