const mongoose=require("mongoose")
const{Schema}=mongoose

const addressSchema=new mongoose.Schema({
    userId: {
        type:Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
   address:[{
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    postOffice:{
        type:String,
        required:true
    },
    address: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    altPhone:{
        type:String,
        required:false
    },
    addressType:{
        type:String,
        enum:['home','office'],
        default:'home'
    }
}]
})
const Address=mongoose.model("Address",addressSchema)
module.exports=Address