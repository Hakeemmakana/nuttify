const Product =require("../../models/productSchema")
const Category=require("../../models/categorySchema")
const fs=require("fs")
const path= require("path")
const sharp=require("sharp")
const multer = require("multer")

const loadProduct=async (req,res)=>{
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

    const product=await Product.find({
        isDeleted:false,
        productName:{$regex:search,$options:"i"}
    })
    .sort({_id:-1})
    .skip(skip)
    .limit(limit)
    .exec()

    const count =await Product.countDocuments({
        isDeleted:false,
        productName:{$regex:search,$options:"i"}
    })
    console.log("productCount",count)
    
    const totalProduct=count
    const totalPages=Math.ceil(count/limit)
    const startItem=skip+1
    const endItem=Math.min(skip+limit,count)
    const category=await Category.find({isDeleted:false})
    res.render("products",{
        category:category,
        product:product,
        currentPage:page,
        search,
        totalProduct,
        totalPages,
        startItem,
        endItem
    })

} catch (error) {
    console.log("error in loadproduc page",error)
}

}



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // 
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },  
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG and PNG images are allowed"));
        }
    }
});

const addProduct = async (req, res) => {
    try {
        upload.array("images", 4)(req, res, async (err) => {
            if (err) {
                console.log("Multer Error:", err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            
            console.log("req.body------", req.body);
            console.log("send file", req.files);

    
            const { productName, productDescription, category,regularPrice,varient,stock,status} = req.body;

            // validation in serverside
            if (!productName || productName.length < 3) {
                return res.status(400).json({ success: false, message: "Product name must be at least 3 characters long" });
            }
            if (!productDescription || productDescription.length < 10) {
                return res.status(400).json({ success: false, message: "Description must be at least 10 characters long" });
            }
            if (!category) {
                return res.status(400).json({ success: false, message: "Category is required" });
            }
            if(!varient){
                return res.status(400).json({sucess:false,message:"Vaient is required"})
            }
            if(!stock){
                return res.status(400).json({sucess:false,message:"Stock is required"})
            }
            if(stock<0){
                return res.status(400).json({sucess:false,message:"Stock is must be positive"})
            }

            // save image
            const imagePaths = [];
            for (let file of req.files) {
                const inputPath = file.path;
                const outputPath = path.join(__dirname, "../../uploads", `optimized-${file.filename}`);

                await sharp(inputPath)
                    .resize(800, 800, { fit: "inside", withoutEnlargement: true }) 
                    // .jpeg({ quality: 80 }) //reducing quality
                    .toFile(outputPath);

                // to delete org file after oprimzed
                fs.unlinkSync(inputPath);
                imagePaths.push(`/uploads/optimized-${file.filename}`);
            }

        
            const newProduct = new Product({
                productName,
                productDescription,
                category,
                regularPrice,
                varient,
                stock,
                status,
                productImage: imagePaths
            });
            await newProduct.save();

            res.status(201).json({
                success: true,
                message: "Product added successfully",
                product: newProduct
            });
        });
    } catch (error) {
        console.log("Error in addProduct:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message
        });
    }
};

const editProduct = async (req, res) => {
    try {
        console.log("171-------------------")
        console.log(req.body)
        console.log("-------------------")
        upload.array("images", 4)(req, res, async (err) => {
            if (err) {
                console.log("Multer Error:", err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            const { productId, productName, productDescription, category, regularPrice,varient,stock,status } = req.body;
        console.log("181-------------------")

            console.log(req.body)
            let imagePaths = [];

            // Validation
            if (!productId) {
                return res.status(400).json({ success: false, message: "Product ID is required" });
            }
            if (!productName || productName.length < 3) {
                return res.status(400).json({ success: false, message: "Product name must be at least 3 characters long" });
            }
            if (!productDescription || productDescription.length < 10) {
                return res.status(400).json({ success: false, message: "Description must be at least 10 characters long" });
            }
            if (!category) {
                return res.status(400).json({ success: false, message: "Category is required" });
            }
            if(!stock){
                return res.status(400).json({sucess:false,message:"Stock is required"})
            }
            if(stock<0){
                return res.status(400).json({sucess:false,message:"Stock is must be positive"})
            }

            // Find the existing product
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            // Handle image updates
            if (req.files && req.files.length > 0) {
                // Delete old images if new ones are uploaded
                for (let oldImage of product.productImage) {
                    const oldImagePath = path.join(__dirname, "../../", oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // Process new images
                for (let file of req.files) {
                    const inputPath = file.path;
                    const outputPath = path.join(__dirname, "../../uploads", `optimized-${file.filename}`);

                    await sharp(inputPath)
                        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
                        // .jpeg({ quality: 80 })
                        .toFile(outputPath);

                    fs.unlinkSync(inputPath);
                    imagePaths.push(`/uploads/optimized-${file.filename}`);
                }
            } else {
                // If no new images, retain old images
                imagePaths = product.productImage;
            }

            // Update product
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                {
                    productName,
                    productDescription,
                    category,
                    regularPrice,
                    varient,
                    stock,
                    status,
                    productImage: imagePaths,
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product: updatedProduct,
            });
        });
    } catch (error) {
        console.log("Error in editProduct:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message,
        });
    }
};


const deleteProduct= async (req,res)=>{
    try {
        const {id}=req.body
        console.log(id)
       await Product.updateOne({_id:id},{$set:{
            isDeleted:true
        }})
        res.redirect("/admin/products")
    } catch (error) {
        console.log("error in deleteProduct",error)
    }

    

}



module.exports={
    loadProduct,
    addProduct,
    editProduct,
    deleteProduct,
}