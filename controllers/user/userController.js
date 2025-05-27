const User =require("../../models/userSchema");
const Category=require("../../models/categorySchema")
const Product=require("../../models/productSchema")
const Offer=require("../../models/offerSchama")
const Wishlist=require("../../models/whishlistSchema")
const nodemailer=require("nodemailer")
const env =require("dotenv").config()

const bcrypt=require("bcrypt")

const loadHomepage=async (req,res)=>{
    try {
        console.log(req.session.user)
        const user=req.session.user
        const categories=await Category.find({isListed:true})
         
        
        let productData=await Product.find({isDeleted:false,
            category:{$in:categories.map(category=>category._id)},
            quantity:{$gt:0}
        })
        

       
        ; // Debugging
        productData.sort((a,b)=>new Date(b.createOn)-new Date(a.createOn))
        // productData=productData.slice(0,4)
        
        if(user){
            const userData=await User.findOne({_id:user._id})
            // console.log(user.name)
            return res.render("home",{userName:user.name,
                products :productData,
                category:categories
            })
        }else{
            return res.render("home",{
                products :productData,
                category:categories
            })

        }
    } catch (error) {
        console.log("home page not found",error)
        return res.status(500).send("server error")
    }
}
const loadSingup=async (req,res)=>{
    try {
    if(req.session.user){
        return res.redirect("/")
    }
        
        if(req.session.singupmsg){
            message=req.session.singupmsg
            req.session.singupmsg=null
           return res.render("singup.ejs",{message:message})
        }

        return res.render("singup.ejs")
    } catch (error) {
        console.log("the signup page not loading",error)
        return res.status(500).send("seerver error")
    }
}
const loadSingin=async (req,res)=>{
    try {
        
        if(!req.session.user){
            res.render("singin",{message:""})
        }else{
            res.redirect("/")
        }
        
    } catch (error) {
        console.log("load loggin error",error)
        res.redirect("/pageNotFound")
    }
}

// const singup=async (req,res)=>{
//     const{firstName,lastName,email,password}=req.body
//     console.log(req.body)
//     try {
//         const newUser =new User({firstName,lastName,email,password})
//         await newUser.save()
        
//         res.redirect("/login")
//         return
        
//     } catch (error) {
//         console.log("error in singup",error);
//         res.status(500).send("internal server error")
        
//     }
// }
function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}
async function sendVerificationEmail(email,otp){
    // console.log("kkkfkfkf")
    try {
        const transporter=nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.EMAIL,
                
                pass:process.env.EMAIL_PASSWORD
            }
        })
        // console.log(process.env.EMAIL)
      const info =await transporter.sendMail({
        from:process.env.EMAIL,
        to:email,
        subject:"Verify your email",
        text:`Your OTP is ${otp}`,
        html:`<b>Your OTP:${otp}</b>`
      })
      return info.accepted.length>0
    } catch (error) {
        console.error("Error sending email",error)
        return falser
    }
}


// --------------------sing up validation function name and password------------


function isStrongPassword(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return regex.test(password);
  }

  function isValidName(name) {
    const regex = /^[A-Za-z\s]{3,}$/;
    return regex.test(name);
  }
  function isValidPhone(phone){
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone)
  }

const singup =async (req,res)=>{
    const {name,phone,email,password,cPassword,}=req.body
    req.session.userData={name,phone,email,password}
    // console.log("--------------------")
    // console.log(req.session.userData);
    // console.log("--------------------")
    
    
    try {

        const findUser =await User.findOne({email})

        
        if(findUser) {
            req.session.singupmsg="User already existed"
            
            res.redirect("/singup")
            return
        }
        if (!isValidName(name)) {
            req.session.singupmsg = "Name must be at least 3 letters and contain only alphabets.";
            return res.redirect("/singup");
          }
        
        if(password!==cPassword){
            req.session.singupmsg="password doesn't match"        
             return res.redirect("/singup")
      }
       
      if (!isStrongPassword(password)) {
        req.session.singupmsg = "Password must contain at least one letter, one number, and be 6+ characters long.";
        return res.redirect("/singup");
      }
   
    if(!isValidPhone(phone)){
        req.session.singupmsg="Enter valid Phone number"
        return res.redirect("/singup")
    }

    const otp=generateOtp()
    

    const emailSend=await sendVerificationEmail(email,otp)
    
    if(!emailSend){
        return res.json("email-error")
    }
    req.session.userOtp = {
        code: otp,
        expiresAt: Date.now() + 60 * 1000 // 60 seconds
    }
    
    // console.log("kkkkkkkkkkkkkk")
    // console.log(req.session.userData)
    // console.log("kkkkkkkkkkkkkk")
    // req.session.userData={firstName,lastName,email,password}
    
    
    req.session.singupmsg="verify-otp"
    console.log("OTP Send",otp)

    res.redirect("/otpsection")
    
   } catch (error) {
    console.error("signup error",error)
    res.redirect("/pageNotFound")
   }
}
 const loadOtp=async (req,res)=>{
    res.render("otp.ejs")
 }
 const securePassword=async(password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
 }
 const verifyOtp=async (req,res)=>{
    
    try {
        const {otp}=req.body
        console.log("otp ",otp)
       const sessionOtp=req.session.userOtp
        
       if (!sessionOtp || Date.now() > sessionOtp.expiresAt) {
        return  res.render("otp",{message:'Invalid OTP,plese try again'})

        // return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }


        if(otp===req.session.userOtp){
           
            const user =req.session.userData
            console.log(user.password)
            const passwordHash=await securePassword(user.password)
            console.log(passwordHash)
            const saveUserData=new User({
                name:user.name,
                phone:user.phone,
                email:user.email,
                password:passwordHash
            })

            saveUserData.save()
            req.session.user=saveUserData;
            res.json({success:true,
                message:"User created succesfully..",
                redirectUrl:"/"})
         

        }else{
            res.status(400).json({success:false,message:"Invalid OTP,plese try again"})
        }
    } catch (error) {
        
        console.log("error verify otp",error);
        
    }
    
 }

 const resendOtp= async (req,res)=>{
    
     try {
        
        const { email } = req.session.userData || {};
        
        if(!email){
            return res.status(400).json({
                success:false,
                message:"Email not found in session",
            })
        }
           
           
            const resentotp = generateOtp()
            // req.session.userOtp=resentotp
            
                const emailSend=await sendVerificationEmail(email,resentotp)
                if(emailSend){
                    req.session.userOtp = resentotp
                    console.log("resentotp:",resentotp)
                  
                    res.status(200).json({success:true,message:"OTP Resent Successfully"
                        
                    })
                }else{
                        res.status(500).json({success:false,message:"Failed to resend otp "})
                }
            
        
     } catch (error) {
        console.log("error in resend otp ",error)
        res.status(500).json({success:false,message:"Internal server erorr"})

    }
 }
 const pageNotFound=async (req,res)=>{
    res.render("404")
 }
const singin = async (req,res)=>{
    try {
        const {email,password}=req.body
        const findUser = await User.findOne({isAdmin:0,email:email,isVerified:true})
        if(!findUser){
            return res.render("singin",{message:"user not found"})
        }
        if(!findUser.isVerified){
            return res.render("singin",{message:"User is blocked by admin"})
        }
        if(findUser && findUser.googleId && findUser.googleId !== ''){
            return res.render("singin",{message:"its already registeded using google id"})
        }
        const passwordMatch=await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
            return res.render("singin",{message:"Incorrect password"})
        }
        req.session.user=findUser
        res.redirect("/")
    } catch (error) {
        console.log("login error",error)
        res.render("singin",{message:"Login failed,plese try again later"})
    }
}
const logout=async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("sesson destruture error")
                return res.redirect("/pageNotFound")
            }
            return res.redirect("/")
        })

    } catch (error) {
        console.log("error in logout",error)
        return res.redirect("/pageNotFound")
    }

}

const loadShoppingPage=async (req,res)=>{
    try {
        console.log("-------------")
        console.log(req.session.user)
        const user=req.session.user
        const userData=await User.findOne({_id:user,isVerified:true})
        const categories =await Category.find({isDeleted:false})
        const categoryIds=categories.map((category)=>category._id.toString())
        const page =parseInt(req.query.page)||1
        const limit=6
        const skip=(page-1)*limit
        const products =await Product.find({
            isDeleted:false,
            category:{$in:categoryIds},
            quantity:{$gt:0}
        })
        .sort({createdOn:-1})
        .skip(skip)
        .limit(limit)
        const totalProducts=await Product.countDocuments({
            isDeleted:false,
            category:{$in:categoryIds},
            quantity:{$gt:0}
        })
        const totalPages=Math.ceil(totalProducts/limit)
        startItem=skip+1
        const endItem=Math.min(skip+limit,totalProducts)
        
        const categoriesWithIds=categories.map(category=>({_id:category._id,name:category.name}))

        const wishlist =await Wishlist.findOne({ userId:user})
        // console.log("wishlist",wishlist)

        let wishlistProductIds=[]
        if(wishlist){
            wishlistProductIds = wishlist.products.map(item => item.productId.toString());
  
               
        }

        console.log("wishlistProductIds",wishlistProductIds)

        const currentDate=new Date()
       
        // console.log("jjjjjjj",products)
        console.log(user.name)
        res.render("shoap",{
            userName:user.name,
            products:products,
            category:categoriesWithIds,
            totalproducts:totalProducts,
            currentPage:page,
            totalPages:totalPages,
            startItem,
            endItem,
            totalProducts,
            wishlistProductIds,

           
           
        })
    } catch (error) {
        console.log("error in loadSopping Page",error)
    }
}


// const filterProduct=async (req,res)=>{
//     try {
//         const User=req.session.user
//         const category=req.query.category
//         const findCategory=category?await Category.findOne({_id:category}):null;
//         const query= {
//             idBlocked:false,
//             quantity:{$gt:0},
//         }
//         if(findCategory){
//             query.category=findCategory._id;
//         }
//         let findProducts=await product.find(query).lean()
//         findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))

//         const categories=await Category.find({isDeleted:flase})
//         let itemsPerPage=6
//         let currentPage= parseInt(req.query.page)||1
//         let startIndex=(currentPage-1)*itemsPerPage
//         let endIndex=startIndex+itemsPerPage
//         let totalPages=Math.ceil(findProducts.length/itemsPerPage)
//         let currentProduct=findProducts.slice(startIndex,endIndex)
//         let userData =null
//         if(user){
//             usrData=await User.findOnde({_id:user})
//             if(userData){
//                 const searchEntry={
//                     category:findCategory?findCategory._id:null,
//                     searchedOn:new Date()
//                 }
//                 userData.searchHistory.push(searchEntry)
//                 await userData.save()
//             }
//         }
//       req.session.filteredProducts=currentProduct
//       res.render("shop",{
//         user:userData,
//         products:currentProduct,
//         category:categories,
//         totalPages,
//         currentPage,
//         selectedCategory:category||null
//       })

//     } catch (error) {
//         conslole.log("error in filter page",error)
//     }
// }


const filterProduct = async (req, res) => {
    
        try {
          const { sort, category,search, price } = req.query;
        //   console.log("hellow",category)
        let paginationCategory=''
        let paginationPriceRange=''
        //   console.log("ddddd",search)
          let query = { isDeleted: false };
        //   console.log(category)
      
          // Filter by category
          if(category){
          if (Array.isArray(category) ) {
            query.category = {$in: category }
            paginationCategory=category.map(cat=>`category=${cat}`).join('&')
          } else{
            query.category =category
            paginationCategory=`category=${category}`
          }
        }
      
          // Filter by price range
          if (price) {
            const priceRanges = Array.isArray(price) ? price : [price];
            // console.log('Price Ranges:', priceRanges);
            req.session.priceRanges=priceRanges
            const priceConditions = priceRanges.map(range => {
              if (range === '2000') {
                return { regularPrice: { $gte: '2000' } };
              } else {
                const [min, max] = range.split('-').map(Number);
                return {
                  $expr: {
                    $and: [
                      { $gte: [{ $toDouble: '$regularPrice' }, min] },
                      max ? { $lte: [{ $toDouble: '$regularPrice' }, max] } : {}
                    ]
                  }
                };
              }
            });
            query.$or = priceConditions;
           
          }
          if(Array.isArray(price)){
            paginationPriceRange=price.map(price=>`price=${price}`).join('&')
          }else{
            paginationPriceRange=price
          }
          if(search){
            
            query.productName={$regex:search,$options:'i'}
          }

          let sortOption = {};

        if (sort === 'price-low-high') {
        sortOption = { regularPrice: 1 }; 

        } else if (sort === 'price-high-low') {
        sortOption = { regularPrice: -1 }; 
        }

          const page =parseInt(req.query.page)||1
          const limit =6
        const skip=(page-1)*limit
        const startItem=skip+1
        let products = await Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('category');
        let totalProducts = await Product.countDocuments(query)
        const endItem=Math.min(skip+limit,totalProducts)
        const totalPages=Math.ceil(totalProducts/limit)
        //   // Sorting
        //   if (sort) {
        //     switch (sort) {
        //       case 'price-low-high':
        //         products.sort((a, b) => parseFloat(a.regularPrice) - parseFloat(b.regularPrice));
        //         break;
        //       case 'price-high-low':
        //         products.sort((a, b) => parseFloat(b.regularPrice) - parseFloat(a.regularPrice));
        //         break;
        //       case 'relevance':
        //         // Define your relevance logic here if needed
        //         break;
        //     }
        //   }
      
          const categories = await Category.find({ isDeleted: false });
          const user=req.session.user
           const wishlist =await Wishlist.findOne({ userId:user})
        console.log("wishlist",wishlist)

        let wishlistProductIds=[]
        if(wishlist){
            wishlistProductIds = wishlist.products.map(item => item.productId.toString());
  
               
        }
        const currentDate=new Date()
        const offer=await Offer.find({
            status:'Active',
            startDate:{$lt:currentDate},
            endDate:{$gte:currentDate}
        })

       
        console.log(products)
        // console.log(paginationCategory)
          res.render('shoap', {
             products, 
             category: categories,
             selectedCategory:category,
             sort:sort,
             priceRanges:req.session.priceRanges,
             search:search,
             totalProducts,
             startItem,
             endItem,
             totalPages,
             currentPage:page,
             paginationCategory,
             wishlistProductIds,
             paginationPriceRange,
             userName: user.name,
             offer 
            });
        } catch (err) {
          console.error(err);
          res.status(500).send('Server Error');
        }
      
};

const productDetails= async (req,res)=>{
    try {
        // console.log('usergoogle',req.user)
        // console.log('userNormal',req.session.user)
        const user=req.session.user
        if(!user){
            return res.redirect("/singin")
        }
        // console.log(user)
        const userName=user.name
        const id= req.query.id
     
    const product=await  Product.findOne({_id:id}).populate("category")
    const relatedProducts=await Product.find({
        category:product.category,
        _id:{$ne:product._id}
    })
    .limit(4)
    const wishlist =await Wishlist.findOne({ userId:user})

    let wishlistProductIds=[]
        if(wishlist){
            wishlistProductIds = wishlist.products.map(item => item.productId.toString());
       
        }
        const currentDate=new Date()
        const allOffers=await Offer.find({
            status:'Active',
            startDate:{$lt:currentDate},
            endDate:{$gte:currentDate}
        })
        const offers = allOffers.filter(offer => {
            const targetId = offer.targetId?.toString();
            const productId = product._id.toString();
            const categoryId = product.category._id.toString(); // assuming populated or included
        
            return (
                (offer.offerType === 'product' && targetId === productId) ||
                (offer.offerType === 'category' && targetId === categoryId)
            );
        });
        let discountAmount=0
        // console.log("offereeees:",offers)
        const bestOffer = getBestOffer(offers, product);
        if(bestOffer){
            discountAmount=(product.regularPrice*bestOffer.discountValue)/100
        }
        // console.log("discountAmount",discountAmount)
const afterDiscountAmount=product.regularPrice-discountAmount

// console.log("{{{{{{{{{{{{{{{{{{{{{{")        
// console.log("discountamount: ",discountAmount)        
// console.log(bestOffer)        

    // console.log(relatedProducts)
    res.render("productDetail",{
        product:product,
        userName:userName,
        category:product.category,
        relatedProducts:relatedProducts,
        wishlistProductIds,
        afterDiscountAmount

    })
    } catch (error) {
        console.log(error)
    }
    
    
}

function getBestOffer(applicableOffers, product) {
    if (!Array.isArray(applicableOffers) || applicableOffers.length === 0) return null;
  
    let bestOffer = null;
    let maxDiscount = 0;
  
    const price = product.price || product.regularPrice || 0;
  
    if (price <= 0) {
    //   console.log(`Invalid price for product: ${product.productName}`);
      return null;
    }
  
    for (const offer of applicableOffers) {
      const discount = (price * offer.discountValue) / 100;
  
      if (discount < price && discount > maxDiscount) {
        maxDiscount = discount;
        bestOffer = offer;
      }
    }
  
    return bestOffer;
  }
  
  const contact=async (req,res)=>{
    try {
        res.render("contact",{
            searchRemove:true
        })

    } catch (error) {
        console.log("errro in conact load page",error)
    }
  }

  const about=async (req,res)=>{
    try {
        res.render("about",{
            searchRemove:true
        })
        
    } catch (error) {
        console.log("errro in about load page",error)
    }
  }




module.exports={
    loadHomepage,
    loadSingup,
    loadSingin,
    singup,
    loadOtp,
    verifyOtp,
    resendOtp,
    pageNotFound,
    singin,
    logout,
    loadShoppingPage,
    filterProduct,
    productDetails,
    contact,
    about
    
}