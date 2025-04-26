


const cartToCheckout=async (req,res) =>{
    if(!req.session.used){
        res.json({
            success:false,
            msg:'session expired'
        })
    }
    
}

module.exports={
    cartToCheckout
}