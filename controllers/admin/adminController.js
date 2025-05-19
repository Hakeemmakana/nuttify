const User = require("../../models/userSchema")
const mongoose=require("mongoose")
const Order=require("../../models/orderSchema")
const bcrypt= require("bcrypt")
const PDFDocument = require('pdfkit');
const Product=require('../../models/productSchema')

const loadLogin=async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin")
        }
       return res.render("loginsection/login")
    } catch (error) {
        console.log("load login error ",error)
    }
}
const login=async (req,res)=>{
    try {
        const{email,password}=req.body
        if(req.session.admin){
            return res.redirect("/admin")}
        const admin=await User.findOne({email,isAdmin:true})
        if(!admin){
            return res.redirect("/admin/login")
        }
        const passwordMatch=await bcrypt.compare(password,admin.password)
        if(passwordMatch){
            req.session.admin=true
            return res.redirect("/admin")
        }else{
            return res.redirect("/login")
        }
    } catch (error) {
        console.log("error in admin login",error)
        return res.redirect("/pageError")
    }
}

// const loadDashboard= async (req,res)=>{
//     if(req.session.admin){
//         try {
//             res.render("dashboard")
//         } catch (error) {
//             console.log(error)
//             res.redirect("/pageError")
//         }
//     }
// }

const logout =async (req,res)=>{
   try {
    req.session.destroy((err)=>{
        if(err){
            console.log("error in session destroy",err)
            return res.status(500).send("Error logging out.")
        }
        res.redirect("/admin/login")
        
    })
    
} catch (error) {
    console.log("error in logout",error)
    return res.status(500).send("Internal server error.");
   }
}
const pageError=async (req,res)=>{
    try {
       res.render("admin/pageError") 
    } catch (error) {
        console.log("error in pageError",error)
    }
}


const loadSalesReport= async (req,res)=>{
    try {
        let orders
        let reportType,end,start,netOrdersData
        // let orders=await Order.find({})
        if(req.session.orderIds){
            const orderIds=req.session.orderIds.map(id=>new mongoose.Types.ObjectId(id))
            orders = await Order.find({ _id: { $in: req.session.orderIds } });

            reportType= req.session.reportType
            end=req.session.endDate
            start=req.session.startDate
        console.log("session",req.session.orderIds.length)
        
        
             netOrdersData=await Order.aggregate([{
                $match:{
                    _id:{$in:orderIds},
                    status:{$in:['Shipped','Deliverd']}
                }
            },
                {
                $group:{
                    _id:null,
                    netOrders:{$sum:1},
                    netAmount:{$sum:"$finalAmount"}
                }
            }])
            console.log(netOrdersData)
            
            
        }else{
            const today=new Date()
            const start1 = new Date(today.setHours(0, 0, 0, 0));
            const end1 = new Date(today.setHours(23, 59, 59, 999));
             orders = await Order.find({
                createdAt: { $gte: start1, $lte: end1 }
            }).sort({createdAt:-1})
             netOrdersData=await Order.aggregate([{
                $match:{
                    status:{$in:['Shipped','Deliverd']}
                }
            },
                {
                $group:{
                    _id:null,
                    netOrders:{$sum:1},
                    netAmount:{$sum:"$finalAmount"}
                }
            }])
           
        }



        let totalAmount = 0;
        let totalDiscount = 0;
        let couponDiscount = 0;
        let finalAmount=0
        orders.forEach(items=>{
            totalAmount+=items.totalAmount
            totalDiscount+=items.totalDiscount
            couponDiscount+=items.couponDiscount
            finalAmount+=items.finalAmount

        })
        console.log("fffffff",orders.length)
        res.render("salesRepport",{
            orders,
            reportType,
            start,end,
            totalAmount,totalDiscount,
            couponDiscount,
            netOrdersData
        })
        
    } catch (error) {
       console.log("error in sales report page ",error) 
    }
}
 const salesReport=async (req,res)=>{
    try {
        console.log(req.body)
const {reportType,startDate,endDate}=req.body
const today=new Date()
// let start,end
let start = new Date(today.setHours(0, 0, 0, 0));
let end = new Date(today.setHours(23, 59, 59, 999));
switch (reportType) {
    case 'daily':
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
    case 'weekly':
        start = new Date();
        start.setDate(today.getDate() - 7);
        end = new Date();
        break;
    case 'monthly':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
    case 'yearly':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date();
        break;
    case 'custom':
        if (!startDate || !endDate) {
            return res.json({ success: false, message: 'Start and end dates are required for custom range.' });
        }
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
    default:
        return res.json({ success: false, message: 'Invalid report type.' });
}
const orders = await Order.find({
    createdAt: { $gte: start, $lte: end }
}).sort({createdAt:-1})
console.log(orders.length)
req.session.reportType=reportType
req.session.endDate=end
req.session.startDate=start
req.session.orderIds=orders.map(order => order._id);
await req.session.save()

console.log("hhhhhh",req.session.orderIds.length)
res.json({
    success:true
})
    } catch (error) {
        console.log("error in sales repotget",error)
    }
 }



 const loadDashboard = async (req, res) => {
    try {
        // Get filter parameters from query
        const { timeFilter = 'all', startDate, endDate, orderStatus = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Get counts for key metrics
        const totalUsers = await User.countDocuments({ isAdmin: false }) || 0;
        const totalProducts = await Product.countDocuments({ isDeleted: false }) || 0;
        const totalOrders = await Order.countDocuments({ status: { $ne: 'orderFailed' } }) || 0;

        // Calculate percentage changes (comparing current period to previous period)
        const now = new Date();
        let prevDateFilter = {};
        let currentDateFilter = {};

        switch (timeFilter) {
            case 'today':
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);
                
                currentDateFilter = {
                    createdAt: {
                        $gte: todayStart,
                        $lte: todayEnd
                    }
                };
                
                const yesterdayStart = new Date(todayStart);
                yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                
                const yesterdayEnd = new Date(todayEnd);
                yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
                
                prevDateFilter = {
                    createdAt: {
                        $gte: yesterdayStart,
                        $lte: yesterdayEnd
                    }
                };
                break;
            case 'yesterday':
                const yesterdayStartDate = new Date(now);
                yesterdayStartDate.setDate(yesterdayStartDate.getDate() - 1);
                yesterdayStartDate.setHours(0, 0, 0, 0);
                
                const yesterdayEndDate = new Date(now);
                yesterdayEndDate.setDate(yesterdayEndDate.getDate() - 1);
                yesterdayEndDate.setHours(23, 59, 59, 999);
                
                currentDateFilter = {
                    createdAt: {
                        $gte: yesterdayStartDate,
                        $lte: yesterdayEndDate
                    }
                };
                
                const dayBeforeYesterdayStart = new Date(yesterdayStartDate);
                dayBeforeYesterdayStart.setDate(dayBeforeYesterdayStart.getDate() - 1);
                
                const dayBeforeYesterdayEnd = new Date(yesterdayEndDate);
                dayBeforeYesterdayEnd.setDate(dayBeforeYesterdayEnd.getDate() - 1);
                
                prevDateFilter = {
                    createdAt: {
                        $gte: dayBeforeYesterdayStart,
                        $lte: dayBeforeYesterdayEnd
                    }
                };
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - 7);
                weekStart.setHours(0, 0, 0, 0);
                
                currentDateFilter = {
                    createdAt: { $gte: weekStart, $lte: now }
                };
                
                const prevWeekStart = new Date(weekStart);
                prevWeekStart.setDate(prevWeekStart.getDate() - 7);
                
                prevDateFilter = {
                    createdAt: {
                        $gte: prevWeekStart,
                        $lte: weekStart
                    }
                };
                break;
            case 'month':
                const monthStart = new Date(now);
                monthStart.setDate(monthStart.getDate() - 30);
                monthStart.setHours(0, 0, 0, 0);
                
                currentDateFilter = {
                    createdAt: { $gte: monthStart, $lte: now }
                };
                
                const prevMonthStart = new Date(monthStart);
                prevMonthStart.setDate(prevMonthStart.getDate() - 30);
                
                prevDateFilter = {
                    createdAt: {
                        $gte: prevMonthStart,
                        $lte: monthStart
                    }
                };
                break;
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                
                currentDateFilter = {
                    createdAt: {
                        $gte: yearStart,
                        $lte: yearEnd
                    }
                };
                
                const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
                const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                
                prevDateFilter = {
                    createdAt: {
                        $gte: lastYearStart,
                        $lte: lastYearEnd
                    }
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end || end > now) {
                        throw new Error('Invalid date range');
                    }
                    
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    
                    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    
                    currentDateFilter = {
                        createdAt: { $gte: start, $lte: end }
                    };
                    
                    const prevStart = new Date(start);
                    prevStart.setDate(prevStart.getDate() - duration);
                    
                    const prevEnd = new Date(start);
                    prevEnd.setDate(prevEnd.getDate() - 1);
                    prevEnd.setHours(23, 59, 59, 999);
                    
                    prevDateFilter = {
                        createdAt: {
                            $gte: prevStart,
                            $lte: prevEnd
                        }
                    };
                } else {
                    throw new Error('Start and end dates are required for custom range');
                }
                break;
            default:
                // All time - no date filtering
                currentDateFilter = {};
                prevDateFilter = {};
        }

        // Revenue for current and previous periods
        const currentOrders = await Order.find({ ...currentDateFilter, status: 'Deliverd' }).catch(() => []);
        const prevOrders = await Order.find({ ...prevDateFilter, status: 'Deliverd' }).catch(() => []);

        let totalRevenue = 0;
        currentOrders.forEach(order => {
            totalRevenue += order.finalAmount || 0;
        });

        let prevRevenue = 0;
        prevOrders.forEach(order => {
            prevRevenue += order.finalAmount || 0;
        });

        const revenueChange = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue ? 100 : 0;

        // Orders change
        const ordersChange = prevOrders.length ? ((currentOrders.length - prevOrders.length) / prevOrders.length) * 100 : currentOrders.length ? 100 : 0;

        // Users change
        const currentUsers = await User.countDocuments({ ...currentDateFilter, isAdmin: false }) || 0;
        const prevUsers = await User.countDocuments({ ...prevDateFilter, isAdmin: false }) || 0;
        const usersChange = prevUsers ? ((currentUsers - prevUsers) / prevUsers) * 100 : currentUsers ? 100 : 0;

        // Products change
        const currentProducts = await Product.countDocuments({ ...currentDateFilter, isDeleted: false }) || 0;
        const prevProducts = await Product.countDocuments({ ...prevDateFilter, isDeleted: false }) || 0;
        const productsChange = prevProducts ? ((currentProducts - prevProducts) / prevProducts) * 100 : currentProducts ? 100 : 0;

        // Add order status filter
        let orderFilter = { status: { $ne: 'orderFailed' } };
        if (orderStatus !== 'all') {
            orderFilter.status = orderStatus;
        }

        // Combine filters
        const combinedFilter = { ...currentDateFilter, ...orderFilter };

        // Dynamic time-based revenue and order data
        let labels = [];
        let monthlyRevenue = [];
        let monthlyOrders = [];

        if (timeFilter === 'today') {
            for (let hour = 0; hour < 24; hour++) {
                const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
                const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 59, 59, 999);
                labels.push(`${hour}:00`);
                const ordersInHour = await Order.find({
                    createdAt: { $gte: startOfHour, $lte: endOfHour },
                    status: 'Deliverd'
                }).catch(() => []);
                let revenueInHour = 0;
                ordersInHour.forEach(order => {
                    revenueInHour += order.finalAmount || 0;
                });
                monthlyRevenue.push(revenueInHour);
                monthlyOrders.push(ordersInHour.length);
            }
        } else if (timeFilter === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            for (let hour = 0; hour < 24; hour++) {
                const startOfHour = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), hour, 0, 0);
                const endOfHour = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), hour, 59, 59, 999);
                labels.push(`${hour}:00`);
                const ordersInHour = await Order.find({
                    createdAt: { $gte: startOfHour, $lte: endOfHour },
                    status: 'Deliverd'
                }).catch(() => []);
                let revenueInHour = 0;
                ordersInHour.forEach(order => {
                    revenueInHour += order.finalAmount || 0;
                });
                monthlyRevenue.push(revenueInHour);
                monthlyOrders.push(ordersInHour.length);
            }
        } else if (timeFilter === 'week') {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - 7);
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
                const ordersInDay = await Order.find({
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    status: 'Deliverd'
                }).catch(() => []);
                let revenueInDay = 0;
                ordersInDay.forEach(order => {
                    revenueInDay += order.finalAmount || 0;
                });
                monthlyRevenue.push(revenueInDay);
                monthlyOrders.push(ordersInDay.length);
            }
        } else if (timeFilter === 'month') {
            const monthStart = new Date(now);
            monthStart.setDate(monthStart.getDate() - 30);
            for (let i = 0; i < 30; i++) {
                const date = new Date(monthStart);
                date.setDate(monthStart.getDate() + i);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                const ordersInDay = await Order.find({
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    status: 'Deliverd'
                }).catch(() => []);
                let revenueInDay = 0;
                ordersInDay.forEach(order => {
                    revenueInDay += order.finalAmount || 0;
                });
                monthlyRevenue.push(revenueInDay);
                monthlyOrders.push(ordersInDay.length);
            }
        } else if (timeFilter === 'year') {
            for (let month = 0; month < 12; month++) {
                const startOfMonth = new Date(now.getFullYear(), month, 1);
                const endOfMonth = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
                labels.push(startOfMonth.toLocaleDateString('en-US', { month: 'short' }));
                const ordersInMonth = await Order.find({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'Deliverd'
                }).catch(() => []);
                let revenueInMonth = 0;
                ordersInMonth.forEach(order => {
                    revenueInMonth += order.finalAmount || 0;
                });
                monthlyRevenue.push(revenueInMonth);
                monthlyOrders.push(ordersInMonth.length);
            }
        } else if (timeFilter === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const interval = durationDays > 365 ? 'year' : durationDays > 60 ? 'month' : durationDays > 14 ? 'week' : 'day';
            
            if (interval === 'year') {
                const startYear = start.getFullYear();
                const endYear = end.getFullYear();
                for (let year = startYear; year <= endYear; year++) {
                    const startOfYear = new Date(year, 0, 1);
                    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
                    
                    const effectiveStart = new Date(Math.max(startOfYear.getTime(), start.getTime()));
                    const effectiveEnd = new Date(Math.min(endOfYear.getTime(), end.getTime()));
                    
                    labels.push(year.toString());
                    const ordersInYear = await Order.find({
                        createdAt: { $gte: effectiveStart, $lte: effectiveEnd },
                        status: 'Deliverd'
                    }).catch(() => []);
                    
                    let revenueInYear = 0;
                    ordersInYear.forEach(order => {
                        revenueInYear += order.finalAmount || 0;
                    });
                    monthlyRevenue.push(revenueInYear);
                    monthlyOrders.push(ordersInYear.length);
                }
            } else if (interval === 'month') {
                let current = new Date(start.getFullYear(), start.getMonth(), 1);
                const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
                
                while (current <= endMonth) {
                    const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
                    const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    const effectiveStart = new Date(Math.max(startOfMonth.getTime(), start.getTime()));
                    const effectiveEnd = new Date(Math.min(endOfMonth.getTime(), end.getTime()));
                    
                    labels.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
                    const ordersInMonth = await Order.find({
                        createdAt: { $gte: effectiveStart, $lte: effectiveEnd },
                        status: 'Deliverd'
                    }).catch(() => []);
                    
                    let revenueInMonth = 0;
                    ordersInMonth.forEach(order => {
                        revenueInMonth += order.finalAmount || 0;
                    });
                    
                    monthlyRevenue.push(revenueInMonth);
                    monthlyOrders.push(ordersInMonth.length);
                    
                    current.setMonth(current.getMonth() + 1);
                }
            } else if (interval === 'week') {
                // Start from the Sunday of the week containing the start date
                let current = new Date(start);
                current.setDate(current.getDate() - current.getDay());
                
                while (current <= end) {
                    const startOfWeek = new Date(current);
                    const endOfWeek = new Date(current);
                    endOfWeek.setDate(current.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    
                    const effectiveStart = new Date(Math.max(startOfWeek.getTime(), start.getTime()));
                    const effectiveEnd = new Date(Math.min(endOfWeek.getTime(), end.getTime()));
                    
                    labels.push(startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                               ' - ' + 
                               endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    
                    const ordersInWeek = await Order.find({
                        createdAt: { $gte: effectiveStart, $lte: effectiveEnd },
                        status: 'Deliverd'
                    }).catch(() => []);
                    
                    let revenueInWeek = 0;
                    ordersInWeek.forEach(order => {
                        revenueInWeek += order.finalAmount || 0;
                    });
                    
                    monthlyRevenue.push(revenueInWeek);
                    monthlyOrders.push(ordersInWeek.length);
                    
                    current.setDate(current.getDate() + 7);
                }
            } else {
                // Daily interval
                let current = new Date(start);
                while (current <= end) {
                    const startOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0);
                    const endOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
                    
                    labels.push(current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    
                    const ordersInDay = await Order.find({
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        status: 'Deliverd'
                    }).catch(() => []);
                    
                    let revenueInDay = 0;
                    ordersInDay.forEach(order => {
                        revenueInDay += order.finalAmount || a0;
                    });
                    
                    monthlyRevenue.push(revenueInDay);
                    monthlyOrders.push(ordersInDay.length);
                    
                    current.setDate(current.getDate() + 1);
                }
            }
        } else {
            // Default: last 12 months
            const start = new Date(now);
            start.setMonth(start.getMonth() - 12);
            
            for (let i = 0; i < 12; i++) {
                const startOfMonth = new Date(start.getFullYear(), start.getMonth() + i, 1);
                const endOfMonth = new Date(start.getFullYear(), start.getMonth() + i + 1, 0, 23, 59, 59, 999);
                
                labels.push(startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
                
                const ordersInMonth = await Order.find({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'Deliverd'
                }).catch(() => []);
                
                let revenueInMonth = 0;
                ordersInMonth.forEach(order => {
                    revenueInMonth += order.finalAmount || 0;
                });
                
                monthlyRevenue.push(revenueInMonth);
                monthlyOrders.push(ordersInMonth.length);
            }
        }

        // Get top 5 selling products
        const topProducts = await Order.aggregate([
            { $match: { ...combinedFilter, status: 'Deliverd' } },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.productId',
                    totalQuantity: { $sum: '$orderItems.quantity' },
                    totalSales: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
                    productName: { $first: '$orderItems.productName' },
                    price: { $first: '$orderItems.price' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
            {
                $set: {
                    productName: { $ifNull: ['$productDetails.productName', '$productName'] }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]).catch(() => []);

        // Get recent orders (last 10) with filters and sorting
        const sortField = sortBy === 'orderId' ? '_id' : sortBy; // Map orderId to _id
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        let recentOrders = [];
        try {
            recentOrders = await Order.find(combinedFilter)
                .sort({ [sortField]: sortDirection })
                .limit(10)
                .populate('userId', 'name')
                .lean();
                
            // Add first item name to each order
            recentOrders = recentOrders.map(order => {
                return {
                    ...order,
                    itemName: order.orderItems && order.orderItems.length > 0 ? 
                        order.orderItems[0].productName || 'N/A' : 'N/A'
                };
            });
        } catch (err) {
            console.error('Error fetching recent orders:', err);
            recentOrders = [];
        }

        res.render('dashboard', {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            revenueChange,
            ordersChange,
            usersChange,
            productsChange,
            labels,
            monthlyRevenue,
            monthlyOrders,
            topProducts,
            recentOrders,
            timeFilter,
            startDate,
            endDate,
            orderStatus,
            sortBy,
            sortOrder
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.redirect('/admin/pageError');
    }
};

const downloadDashboardPDF = async (req, res) => {
    try {
        const { timeFilter = 'all', startDate, endDate, orderStatus } = req.query;

        // Build date filter
        let dateFilter = {};
        const now = new Date();
        if (timeFilter !== 'all') {
            switch (timeFilter) {
                case 'today':
                    dateFilter = {
                        createdOn: {
                            $gte: new Date(now.setHours(0, 0, 0, 0)),
                            $lte: new Date(now.setHours(23, 59, 59, 999))
                        }
                    };
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    dateFilter = {
                        createdOn: {
                            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
                            $lte: new Date(yesterday.setHours(23, 59, 59, 999))
                        }
                    };
                    break;
                case 'week':
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - 7);
                    dateFilter = {
                        createdOn: { $gte: weekStart, $lte: now }
                    };
                    break;
                case 'month':
                    const monthStart = new Date(now);
                    monthStart.setMonth(monthStart.getMonth() - 1);
                    dateFilter = {
                        createdOn: { $gte: monthStart, $lte: now }
                    };
                    break;
                case 'year':
                    dateFilter = {
                        createdOn: {
                            $gte: new Date(2025, 0, 1),
                            $lte: new Date(2025, 11, 31, 23, 59, 59, 999)
                        }
                    };
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        dateFilter = {
                            createdOn: { $gte: start, $lte: end }
                        };
                    }
                    break;
            }
        }

        // Add order status filter
        let orderFilter = { status: { $ne: 'paymentFailed' } };
        if (orderStatus && orderStatus !== 'all') {
            orderFilter.status = orderStatus;
        }

        // Combine filters
        const combinedFilter = { ...dateFilter, ...orderFilter };

        // Fetch data
        const totalUsers = await User.countDocuments({ isAdmin: false }) || 0;
        const totalProducts = await Product.countDocuments({ isDeleted: false }) || 0;
        const totalOrders = await Order.countDocuments(combinedFilter) || 0;

        const orders = await Order.find({ ...combinedFilter, status: 'Delivered' }).catch(() => []);
        let totalRevenue = 0;
        orders.forEach(order => {
            totalRevenue += order.finalAmount || 0;
        });

        const topProducts = await Order.aggregate([
            { $match: { ...combinedFilter, status: 'Delivered' } },
            { $unwind: '$orderedItems' },
            { $group: {
                _id: '$orderedItems.product',
                totalQuantity: { $sum: '$orderedItems.quantity' },
                totalSales: { $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] } },
                productName: { $first: '$orderedItems.name' }
            }},
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]).catch(() => []);

        const recentOrders = await Order.find(combinedFilter)
            .sort({ createdOn: -1 })
            .limit(10)
            .populate('userId', 'name')
            .lean()
            .catch(() => []);

        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-report.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(16).text('Dashboard Report', { align: 'center' });
        doc.moveDown();

        // Key Metrics
        doc.fontSize(12).text('Key Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Total Users: ${totalUsers}`);
        doc.text(`Total Products: ${totalProducts}`);
        doc.text(`Total Orders: ${totalOrders}`);
        doc.text(`Total Revenue: ${totalRevenue.toFixed(2)}`);
        doc.moveDown();

        // Top Selling Products
        doc.fontSize(12).text('Top Selling Products', { underline: true });
        doc.moveDown(0.5);
        topProducts.forEach((product, index) => {
            doc.fontSize(10).text(`${index + 1}. ${product.productName}`);
            doc.text(`   Quantity: ${product.totalQuantity}`);
            doc.text(`   Sales: ${product.totalSales.toFixed(2)}`);
            doc.moveDown(0.5);
        });
        doc.moveDown();

        // Recent Orders
        doc.fontSize(12).text('Recent Orders', { underline: true });
        doc.moveDown(0.5);
        recentOrders.forEach((order, index) => {
            doc.fontSize(10).text(`Order ${index + 1}`);
            doc.text(`Item: ${order.orderedItems[0]?.name || 'N/A'}`);
            doc.text(`Customer: ${order.userId?.name || 'Unknown'}`);
            doc.text(`Total: ${order.finalAmount.toFixed(2)}`);
            doc.text(`Status: ${order.status}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};





module.exports={
    loadLogin,
    login,
    loadDashboard,
    loadSalesReport,
    salesReport,
    logout,
    pageError,
    downloadDashboardPDF

}
