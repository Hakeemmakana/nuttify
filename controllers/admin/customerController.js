
const User =require("../../models/userSchema")




const customerInfo=async(req,res)=>{
    try {
        let search=""
        if(req.query.search){
            search=req.query.search
        }
        let page=1
        if(req.query.page){
            page=req.query.page
        }
        const limit=4
        const skip=(page-1)*limit
        const userData =await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex: search, $options: "i"}},
                {email:{$regex: search, $options: "i"}},
            ]
        })
        .sort({_id:-1})
        .skip(skip)
        .limit(limit)
        .exec()

        const count =await User.find({
            isAdmin:false,

            $or:[
                {name:{$regex: search, $options: "i"}},
                {email:{$regex: search, $options: "i"}},
            ]
        }).countDocuments()
        const totalUsers=count
        const totalPages=Math.ceil(count/limit)
        const startItem=skip+1
        const endItem=Math.min(skip+limit,count)
        res.render("customers", {
            data: userData,
            totalUsers: totalUsers,
            currentPage: page, 
            search:search,
            totalPages:totalPages,
            startItem:startItem,
            endItem:endItem,
        });

    } catch (error) {
        console.log("error in cusromer info",error)
        
    }
}


const blockCustomer=async (req,res)=>{
    try {
        let id=req.body.id
        await User.updateOne({_id:id},{$set:{ isVerified:false}})
        res.redirect("/admin/users")
    } catch (error) {
        console.log("error in delete costomer",error)

    }
}

const unblockCustomer =async (req,res)=>{

    try {
        let id=req.query.id
        await User.updateOne({_id:id},{$set:{isVerified:true}})
        res.redirect("/admin/users")
        
    } catch (error) {
        console.log("error in unblock customer",error)
    }
}







module.exports={
    customerInfo,
    blockCustomer,
    unblockCustomer,
}