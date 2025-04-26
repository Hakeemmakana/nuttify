const mongoose= require ("mongoose")
const {Schema}=mongoose

let userSchema=new Schema({
    name:{
        type:String,
        required:true
    
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparce:false,
        default:null
    },
    googleId:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    isVerified:{
        type:Boolean,
        default:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart"
    }],
    wallet:{
        type:Number,
        default:0
    },
    whishlist:[{
        type:Schema.Types.ObjectId,
        ref:"Whishlist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now
    },
    referalcode:{
        type:String
    },
    radeemed:{
        type:Boolean
    },
    radeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    searchHistory:[{
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
        },
        brant:{
            type:String,
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
    }]
})

const User=mongoose.model("User",userSchema);
module.exports = User;