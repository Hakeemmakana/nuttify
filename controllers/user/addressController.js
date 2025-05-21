const Address=require("../../models/addressSchema")
const User=require("../../models/userSchema")

const addAddress=async(req,res)=>{
    console.log(req.body)
    const{address,addressType,district,altPhone,name,phone,pincode,state,post}=req.body

    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;
    try {
    const findUser=await User.findOne({_id:req.session.user._id})

        if(!findUser){
            return res.json({
                success:false,
                msg: 'Session Expired'
              });
        }

        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.json({ success: false, msg: "plese enter valid name" });
        }
    
        if (!phone || !phoneRegex.test(phone.trim())) {
            return res.json({ success: false, msg: "enter valid phone number" });
        }
    
        if (!pincode || !pincodeRegex.test(pincode.trim())) {
            return res.json({ success: false, msg: "plese enter valid pincode" });
        }
    
        if (!address || address.trim().length < 10 || address.trim().length > 200) {
            return res.json({ success: false, msg: "Address must be 10 charecter" });
        }
    
        if (!district || district.trim().length < 3 || district.trim().length > 50) {
            return res.json({ success: false, msg: "plese enter valid district" });
        }
    
        if (!state || state.trim().length === 0) {
            return res.json({ success: false, msg: "State is required." });
        }
    
        if (altPhone && !phoneRegex.test(altPhone.trim())) {
            return res.json({ success: false, msg: "plese enter valid Alternate " });
        }
    
        if (!addressType || (addressType !== "home" && addressType !== "office")) {
            return res.json({ success: false, msg: "Address type must be either 'Home' or 'Office'." });
        }

        const newAddress={
            address,
            addressType,
            district,
            altPhone,
            name,
            phone,
            pincode,
            state,
            postOffice:post
        }
        let addressAlready=await Address.findOne({userId:req.session.user._id})

        if(!addressAlready){
            addressAlready=new Address({userId:req.session.user._id,address:[newAddress]})
        }else{
            addressAlready.address.push(newAddress)
        }
        
        
        
        await addressAlready.save()
        if(req.session.addressCreate){
            req.session.addressCreate=null
            return res.json({ success: true, msg: "Address added successfully" ,
                redirectUrl:'/checkout'
            })
        }
        return res.json({ success: true, msg: "Address added successfully",
             redirectUrl:'/account/addresses'
         })

    } catch (error) {
console.log("error in add address field",error)
        
    }
       

        
}
const loadAddress= async (req,res)=>{
    try {
        const address= await Address.findOne({userId:req.session.user._id})
console.log(address)
const user=await User.findOne({_id:req.session.user._id})
        res.render("manage-addres",{
            address,
            user
        })

    } catch (error) {
        console.log("error in load login",error)
    }
}

const editAddress=async (req,res)=>{
    const {id,name,phone,pincode,post,address,district,state,altPhone,addressType}=req.body
    try {

        const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;
    
        if(!req.session.user){
            return res.json({
                success:false,
                msg: 'Session Expired'
              });
        }

        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.json({ success: false, msg: "plese enter valid name" });
        }
    
        if (!phone || !phoneRegex.test(phone.trim())) {
            return res.json({ success: false, msg: "enter valid phone number" });
        }
    
        if (!pincode || !pincodeRegex.test(pincode.trim())) {
            return res.json({ success: false, msg: "plese enter valid pincode" });
        }
    
        if (!address || address.trim().length < 10 || address.trim().length > 200) {
            return res.json({ success: false, msg: "Address must be 10 charecter" });
        }
    
        if (!district || district.trim().length < 3 || district.trim().length > 50) {
            return res.json({ success: false, msg: "plese enter valid district" });
        }
    
        if (!state || state.trim().length === 0) {
            return res.json({ success: false, msg: "State is required." });
        }
    
        if (altPhone && !phoneRegex.test(altPhone.trim())) {
            return res.json({ success: false, msg: "plese enter valid Alternate " });
        }
    
        if (!addressType || (addressType !== "home" && addressType !== "office")) {
            return res.json({ success: false, msg: "Address type must be either 'Home' or 'Office'." });
        }

        const updateAddress= await Address.findOneAndUpdate(
            {userId:req.session.user._id,'address._id':id},
            {
                $set:{
                    "address.$.name":name,
                    "address.$.phone": phone,
                    "address.$.pincode": pincode,
                    "address.$.postOffice":post,
                    "address.$.address": address,
                    "address.$.district": district,
                    "address.$.state": state,
                    "address.$.altPhone": altPhone,
                    "address.$.addressType": addressType
                }
            }

        )
        if(!updateAddress){
            return res.json({
                success:false,
                msg:'address not found'
            })
        }
        res.json({
            success:true,
            msg:'address updated successfully'
        })
    } catch (error) {
        console.log("error in edit Address",error)
    }
    
}
const deleteAddress=async (req,res)=>{
    const {id}=req.body
    console.log(req.session.user._id,id)

    if(!req.session.user){
        return res.json({
            success:false,
            msg:'session Expired'
        })
    }
    const deleteAddress= await Address.findOneAndUpdate(
        {userId:req.session.user._id},
        {
            $pull:{
                address:{_id:id}
            }
        }
    )
    if(!deleteAddress){
        return res.json({
            success:false,
            msg:'address not found'
        })
    }
   return res.json({
        success:true,
        msg:'address removed sucessfully'
    })
}

module.exports={
    addAddress,
    loadAddress,
    editAddress,
    deleteAddress

}