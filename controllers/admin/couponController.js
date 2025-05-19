const User= require("../../models/userSchema")
const Coupon=require("../../models/coupenSchema")
const Order = require("../../models/orderSchema")

const loadCoupon=async(req,res)=>{
    try {
         let search=''
            if(req.query.search){
                search=req.query.search||''
            }
            let page=1
            if(req.query.page){
                page = parseInt(req.query.page) || 1;
            }
            const limit=4
            const skip=(page-1)*limit
        
            const coupon=await Coupon.find({
                couponCode:{$regex:search,$options:"i"}
            })
            .sort({_id:-1})
            .skip(skip)
            .limit(limit)
            .exec()
        
            const count =await Coupon.countDocuments({
                couponCode:{$regex:search,$options:"i"}
            })
        // const coupon=await Coupon.find() 

        const totalProduct=count
        const totalPages=Math.ceil(count/limit)
        const startItem=skip+1
        const endItem=Math.min(skip+limit,count)

        res.render("coupon",{
            coupon,
            currentPage:page,
            search,
            totalProduct,
            totalPages,
            startItem,
            endItem
        })
    } catch (error) {
        console.log("errorin loadcoupen error",error)
    }
}
const addCoupon =async(req,res)=>{
    // console.log(req.body)
    try {

        const {couponCode,minPurchase,discountValue,startDate,endDate,status,description} = req.body;
        
  if ( !couponCode.trim()) {
    return res.json({
      success: false,
      msg: "Please enter a valid Coupon Code"
    });
  }

  if (!minPurchase ) {
    return res.json({
      success: false,
      msg: "enter minimum purchase"
    });
  }

  if (!discountValue ) {
    return res.json({
      success: false,
      msg: "Discount Value must be a valid number"
    });
  }
  if (!description ) {
    return res.json({
      success: false,
      msg: "enter discription"
    });
  }

  if (!startDate || isNaN(new Date(startDate))) {
    return res.json({
      success: false,
      msg: "Please enter a valid Start Date"
    });
  }

  if (!endDate || isNaN(new Date(endDate))) {
    return res.json({
      success: false,
      msg: "Please enter a valid End Date"
    });
  }
if (new Date(startDate) > new Date(endDate)) {
    return res.json({
      success: false,
      msg: "Start Date must be before or equal to End Date"
    });
  }
  if (status !== 'Active' && status !== 'Disabled') {
    return res.json({
      success: false,
      msg: "Please select a valid status"
    });}
const exCoupon= await Coupon.findOne({couponCode:couponCode.toUpperCase()})
  if(exCoupon){
    res.json({
        success:false,
        msg:"Coupen already existed"
    })
  }
  
const coupon=new Coupon({
    couponCode:couponCode.toUpperCase(),
    minPurchase,discountValue,startDate,endDate,status,description
})
await coupon.save()

res.json({
    success:true,
    msg:'coupen added successfully'
})
    } catch (error) {
        console.log("error in add coupon",error)
    }
}

const editCoupon=async(req,res)=>{
    try {
        console.log(req.body)
        const {couponCode,minPurchase,discountValue,startDate,endDate,status,description,id} = req.body;
      
  if (!couponCode || !couponCode.trim()) {
    return res.json({
      success: false,
      msg: "Please enter a valid Coupon Code"
    });
  }

  if (minPurchase && isNaN(minPurchase)) {
    return res.json({
      success: false,
      msg: "Minimum Purchase must be a valid number"
    });
  }

  if (discountValue && isNaN(discountValue)) {
    return res.json({
      success: false,
      msg: "Discount Value must be a valid number"
    });
  }
  if (!description ) {
    return res.json({
      success: false,
      msg: "enter discription"
    });
  }

  if (!startDate || isNaN(new Date(startDate))) {
    return res.json({
      success: false,
      msg: "Please enter a valid Start Date"
    });
  }

  if (!endDate || isNaN(new Date(endDate))) {
    return res.json({
      success: false,
      msg: "Please enter a valid End Date"
    });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.json({
      success: false,
      msg: "Start Date must be before or equal to End Date"
    });
  }

  if (status !== 'Active' && status !== 'Disabled') {
    return res.json({
      success: false,
      msg: "Please select a valid status"
    });
  }
// console.log("iddddddddddd",id)
if(!id || id.length !== 24) {
    return res.json({
        success:false,
        msg:"plese enter valid id"
    })

}
  const validateId =await Coupon.findById(id.toString())
  if(!validateId){
    return res.json({
        success:false,
        msg:"plese enter valid id"
    })
  }

  const duplicateName=await Coupon.findOne({
    couponCode:couponCode.toUpperCase(),
    _id:{$ne:id}
})
  if(duplicateName){
    return res.json({
        success:false,
        msg:"coupon already exist"
    })
  }

  await Coupon.findOneAndUpdate({_id:id},{
    couponCode,minPurchase,discountValue,startDate,endDate,status,description
    
  })
  return res.json({
    success:true,
    msg:"coupon edited successfully"
  })

    } catch (error) {
        console.log("error in edit coupon",error)
    }
}

const deleteCoupon=async(req,res)=>{
    const {id}=req.body
    console.log(req.body)
    if(!id || id.length !== 24) {
        return res.json({
            success:false,
            msg:"plese enter valid id"
        })
    }
    const validateId =await Coupon.findById(id)
  if(!validateId){
    return res.json({
        success:false,
        msg:"plese enter valid id"
    })
  }
await Coupon.findByIdAndDelete(id)
return res.json({
    success:true,
    msg:"Coupon deleted successfully"
})
  

}


module.exports={
    loadCoupon,
    addCoupon,
    editCoupon,
    deleteCoupon
}