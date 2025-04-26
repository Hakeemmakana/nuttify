const Category=require("../../models/categorySchema")

const categoryInfo=async (req,res)=>{
    try {
        let search =""
        if(req.query.search){
            search=req.query.search
        }
        
        const page =parseInt(req.query.page)||1
        const limit =4
        const skip=(page-1)*limit
        
        const categoryData=await Category.find({
            isDeleted:false,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ],
            
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
       
        const count=await Category.find({
            isDeleted:false,
            $or: [
                
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ],
        
    }).countDocuments()
        const totalCategories=count
        const totalPages = Math.ceil(count/limit)
        const startItem = skip + 1;
        const endItem = Math.min(skip + limit, count);
        let message=null
        if(req.session.categorymsg){
            message=req.session.categorymsg
            req.session.categorymsg=null
        }
        res.render("categories",{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            startItem:startItem,
            endItem:endItem,
            search:search,
            message
    })
    } catch (error) {
        console.log("error in catogery info",error)
        res.redirect("/pageError")
    }
}

const addCategory=async (req,res)=>{
    const {name,description}=req.body
    try {
        const existingCategory=await Category.findOne({name:{$regex:`${name}$`,$options:"i"}})
        if(existingCategory){
            req.session.categorymsg="Category Already Exists"
            return res.redirect("/admin/category")
            // return res.status(400).json({error:"Category Already Exists"})
        }
        const newCategory =new Category({
            name,
            description,
        })
        await newCategory.save()
        // res.json({message:"Category created succesfully"})
        
        return res.redirect("/admin/category") 

    } catch (error) {
        console.log("error in addCategory",error)
        return res.status(500).json({error:"Internal Server Error"})

        
    }
}
const editCategory=async (req,res)=>{
    try {
     const {name,categoryid,description,isListed}=req.body   
console.log(req.body)
const existingCategory=await Category.findOne({
    _id:{$ne:categoryid},
    name:{$regex:`${name}$`,$options:"i"}})
if(existingCategory){
    req.session.categorymsg="Category Already Exists"
    return res.redirect("/admin/category")
}
     await Category.updateOne({_id:categoryid},{$set:{
        name:name,
        description:description,
        isListed:isListed
     }})
    res.redirect("/admin/category")
    
    } catch (error) {
        
        console.log("error in editcategory",error)
    }
}
const deleteCategory =async(req,res)=>{
    const {id}=req.body
    console.log(id)
   await Category.updateOne({_id:id},{$set:{
        isDeleted:true
    }})
}

module.exports={
    categoryInfo,
    addCategory,
    editCategory,
    deleteCategory

}