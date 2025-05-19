const Product=require("../../models/productSchema")
const Category=require("../../models/categorySchema")
const Offer=require("../../models/offerSchama")
const mongoose=require ("mongoose")


const loadOffer=async(req,res)=>{
    try {

const product =await Product.find({status:'Listed',isDeleted:false})
const category =await Category.find({isListed:true,isDeleted:false})
// const offer =await Offer.find()
// console.log(product)
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

    const offer=await Offer.find({
        offerName:{$regex:search,$options:"i"}
    })
    .sort({_id:-1})
    .skip(skip)
    .limit(limit)
    .exec()

    const count =await Offer.countDocuments({
            
            offerName:{$regex:search,$options:"i"}
        })
    const totalProduct=count
    const totalPages=Math.ceil(count/limit)
    const startItem=skip+1
    const endItem=Math.min(skip+limit,count)

        res.render("offer",{
            products:product,
            categories:category,
            offers:offer,
            search,
            currentPage:page,
            totalProduct,
            totalPages,
            startItem,
            endItem
        })

    } catch (error) {
        console.log("error in loadOffer ",error)
    }
}
const addOffer=async(req,res)=>{
    const offerNameRgx=/^[a-zA-Z0-9\s-_]+$/;
    try {
        const {
            offerName,
            offerType,
            products,
            categories,
            discountValue,
            startDate,
            endDate,
            description,
            status
          } = req.body;
          
          //  name
          if (!offerName || !offerName.trim()) {
            return res.json({
              success: false,
              msg: "Please enter a valid Offer Name"
            });
          }
          if (!offerNameRgx.test(offerName)) {
            return res.json({
              success: false,
              msg: "Offer Name can only contain letters, numbers, spaces, hyphens, and underscores"
            });
          }
          // offer type
          if (offerType !== 'product' && offerType !== 'category') {
            return res.json({
              success: false,
              msg: "Please select a valid Offer Type"
            });
          }
          
          // product or category selected
          if (offerType === 'product' && (!products || products.length === 0)) {
            return res.json({
              success: false,
              msg: "Please select at least one Product"
            });
          }
          if (offerType === 'category' && (!categories || categories.length === 0)) {
            return res.json({
              success: false,
              msg: "Please select at least one Category"
            });
          }
          
          // discount value
          if (!discountValue || isNaN(discountValue) || Number(discountValue) <= 0) {
            return res.json({
              success: false,
              msg: "Discount Value must be a positive number"
            });
          }
          
          // Description
          if (!description || !description.trim()) {
            return res.json({
              success: false,
              msg: "Please enter a valid Description"
            });
          }
          
          // Start Date
          if (!startDate || isNaN(new Date(startDate))) {
            return res.json({
              success: false,
              msg: "Please enter a valid Start Date"
            });
          }
          
          // End Date
          if (!endDate || isNaN(new Date(endDate))) {
            return res.json({
              success: false,
              msg: "Please enter a valid End Date"
            });
          }
          
          // sDate<Edate
          if (new Date(startDate) > new Date(endDate)) {
            return res.json({
              success: false,
              msg: "Start Date must be before or equal to End Date"
            });
          }
          
          // status
          if (status !== 'Active' && status !== 'Disabled') {
            return res.json({
              success: false,
              msg: "Please select a valid status"
            });
          }
          const offerExist=await Offer.findOne({offerName: { $regex: offerName, $options: 'i' }})
          if(offerExist){
           return res.json({
               success: false,
               msg: "offer already exist"
             });
          }
// console.log(req.body)
          if(categories && products){
            console.log("entered two products")
            return res.json({
                success:false,
                msg:"plese select category or product"
            })
          }
          console.log(req.body)
          let categoryOrProduct =''
          let targetId
          if(categories){
            categoryOrProduct='category'
            targetId= categories.map(id => new mongoose.Types.ObjectId(id))
          }else if(products){
            categoryOrProduct="product"
            targetId=products.map(id=> new mongoose.Types.ObjectId(id))
          }
          console.log("------------")
          console.log(targetId)
          console.log("------------")
    const offer =new Offer({
        offerName,
        offerType,
        targetId,
        discountValue,
        startDate,
        endDate,
        description,
        status
    })
    await offer.save()
    res.json({
        success:true,
        msg:"Offer Created Successfully"
    })
          
    } catch (error) {
        console.log("error in add offer",error)
    }
}
const viewEditOffer=async (req,res)=>{
    try {
const offerId=req.params.id
        const offer=await Offer.findById(offerId)
        res.json({ success: true, offer });
    } catch (error) {
        console.log("error in view editOffer ",error)
    }
}

const editOffer=async(req,res)=>{
    const offerNameRgx=/^[a-zA-Z0-9\s-_]+$/;

    try {
        
        // console.log("edit offer",req.body)

        const {
            offerName,offerType,products,categories,discountValue,startDate,
            endDate,description,status,id} = req.body;
          
          //  name
          if (!offerName || !offerName.trim()) {
            return res.json({
              success: false,
              msg: "Please enter a valid Offer Name"
            });
          }
          if (!offerNameRgx.test(offerName)) {
            return res.json({
              success: false,
              msg: "Offer Name can only contain letters, numbers, spaces, hyphens, and underscores"
            });
          }
          // offer type
          if (offerType !== 'product' && offerType !== 'category') {
            return res.json({
              success: false,
              msg: "Please select a valid Offer Type"
            });
          }
          
          // product or category selected
          if (offerType === 'product' && (!products || products.length === 0)) {
            return res.json({
              success: false,
              msg: "Please select at least one Product"
            });
          }
          if (offerType === 'category' && (!categories || categories.length === 0)) {
            return res.json({
              success: false,
              msg: "Please select at least one Category"
            });
          }
          
          // discount value
          if (!discountValue || isNaN(discountValue) || Number(discountValue) <= 0) {
            return res.json({
              success: false,
              msg: "Discount Value must be a positive number"
            });
          }
          
          // Description
          if (!description || !description.trim()) {
            return res.json({
              success: false,
              msg: "Please enter a valid Description"
            });
          }
          
          // Start Date
          if (!startDate || isNaN(new Date(startDate))) {
            return res.json({
              success: false,
              msg: "Please enter a valid Start Date"
            });
          }
          
          // End Date
          if (!endDate || isNaN(new Date(endDate))) {
            return res.json({
              success: false,
              msg: "Please enter a valid End Date"
            });
          }
          
          // sDate<Edate
          if (new Date(startDate) > new Date(endDate)) {
            return res.json({
              success: false,
              msg: "Start Date must be before or equal to End Date"
            });
          }
          
          // Status
          if (status !== 'Active' && status !== 'Disabled') {
            return res.json({
              success: false,
              msg: "Please select a valid status"
            });
          }
          if(!id || id.length !== 24) {
              return res.json({
                  success:false,
                  msg:"plese enter valid id"
              })
          
          }
            const validateId =await Offer.findById(id.toString())
            if(!validateId){
              return res.json({
                  success:false,
                  msg:"plese enter valid id"
              })
            }
          

        const offerExist=await Offer.findOne({
            offerName: { $regex: offerName, $options: 'i' },
            _id:{$ne:id}
        })
       if(offerExist){
        return res.json({
            success: false,
            msg: "offer name already exist"
          });
       }
       if(categories && products){
        console.log("entered two products")
        return res.json({
            success:false,
            msg:"plese select category or product"
        })
      }
      console.log(req.body)
      let categoryOrProduct =''
      let tergetId=[]
      if(categories){
        categoryOrProduct='category'
        targetId=categories
      }else if(products){
        categoryOrProduct="product"
        targetId=products

      }
      console.log("------------")
      console.log(categoryOrProduct)
      console.log(targetId)
      console.log("------------")

       await Offer.findOneAndUpdate({_id:id},{
        offerName,offerType
        ,targetId,discountValue,startDate,
        endDate,description,status})

      return res.json({
        success:true,
        msg:"offer edited successfully"
      })
    

      
    } catch (error) {
        console.log("error in editOffer",error)
    }
}

const deleteOffer=async(req,res)=>{
    try {
        const {id}=req.body
        if(!id || id.length !== 24) {
            return res.json({
                success:false,
                msg:"plese enter valid id"
            })
        }
        const validateId =await Offer.findById(id)
      if(!validateId){
        return res.json({
            success:false,
            msg:"plese enter valid id"
        })
      }
    await Offer.findByIdAndDelete(id)
    return res.json({
        success:true,
        msg:"Coupon deleted successfully"
    })
    } catch (error) {
        console.log("error in delete Offer",error)
    }
}
module.exports={
    loadOffer,
    viewEditOffer,
    addOffer,
    editOffer,
    deleteOffer
}