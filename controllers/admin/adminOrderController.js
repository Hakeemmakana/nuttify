


const loadOrders= async (req,res)=>{
    try {
        res.render("adminOrders")
    } catch (error) {
        console.log("error in loadOrders")
    }
}
module.exports={
    loadOrders
}