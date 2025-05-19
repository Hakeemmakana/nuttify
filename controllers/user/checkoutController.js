

const Address = require("../../models/addressSchema")
const Cart = require("../../models/cartSchema")
const Product = require("../../models/productSchema")
const Order = require('../../models/orderSchema')
const env = require("dotenv").config();
const Razorpay = require("razorpay")
const Offer = require("../../models/offerSchama")
const Wallet = require("../../models/walletSchema");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const loadCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            res.json({
                success: false,
                msg: 'session expired'
            })
        }
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId')

        if (!cart || cart.items.length == 0) {
            return res.json({
                success: false,
                msg: 'cart is empty'
            })
        }
        cart.items.forEach(item => {
            if (item.productId.stock < item.stock) {
                return res.render('chekout', {
                    msg: "quntity exeed stock"
                })
            }

        })

        let subTotal = 0
        cart.items.forEach(item => {
            subTotal += item.totalPrice
        })
        console.log("ddddddddddddddddd")
        cart.items.forEach(item => {
            console.log("Product:", item.productId?.productName);
            console.log("Category:", item.productId?.category?.name);
        });
        const product = cart.items
        const currentDate = new Date()
        const allOffers = await Offer.find({
            status: 'Active',
            startDate: { $lt: currentDate },
            endDate: { $gte: currentDate }
        })
        console.log("alllofferssss :", allOffers)

        const result = cart.items.map((item) => {
            console.log("itme--", item.productId.category._id)
            console.log("itmiiiiie--", allOffers[0]._id)
            const offers = allOffers.filter(offer => {
                const targetId = offer.targetId?.toString();
                const productId = item.productId._id.toString();
                const categoryId = item.productId.category._id.toString(); // assuming populated or included

                return (
                    (offer.offerType === 'product' && targetId === productId) ||
                    (offer.offerType === 'category' && targetId === categoryId)
                );
            });
            console.log("offerssss :", offers)
            const bestOffer = getBestOffer(offers, item);
            return {
                product: item,
                bestOffer
            }
        })
        const totalDiscountBF = result.reduce((sum, item) => {
            const { bestOffer, product } = item
            let discount = 0
            if (bestOffer && bestOffer.discountValue > 0) {
                discount = (product.totalPrice * bestOffer.discountValue) / 100
            }
            return sum + discount
        }, 0)
        const totalDiscount = Math.floor(totalDiscountBF)
        console.log("oooooooooooooooooooo")
        console.log(result)
        console.log(totalDiscount)
        let couponDiscount = 0
        if (req.session.appliedCoupon) {
            couponDiscount = Math.floor(((subTotal - totalDiscount) * req.session.appliedCoupon) / 100)

        }

        const address = await Address.findOne({ userId: req.user._id })
        // console .log("checkout address",address)
        res.render("checkout", {
            cart,
            address,
            totalDiscount,
            couponDiscount


        })

    } catch (error) {
        console.log("error in chekout page", error)
    }



}


const checkout = async (req, res) => {
    const { addressId, paymentOption } = req.body
    try {

        if (!req.session.user) {
            return res.json({
                success: false,
                msg: 'session expired'
            })
        }

        const address = await Address.findOne({ userId: req.user._id })
        const cartAddress = address.address.find(item => item._id.toString() == addressId.toString())
        console.log(cartAddress)
        if (!cartAddress) {
            return res.json({
                success: false,
                msg: 'address not exist'
            })
        }



        //    let address = {

        //    }
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId')
        if (!cart || cart.items.length === 0) {
            return res.json({
                success: false,
                msg: "already ordered"
            })
        }
        cart.items.forEach(item => {
            if (item.productId.stock < item.quantity) {
                return res.json({
                    success: false,
                    msg: 'quntity exeed in product stock'
                })
            }

        })

        if (!(paymentOption == 'razorpay' || paymentOption == 'cashOnDelivery' || paymentOption == 'wallet' || paymentOption == 'retryPayment')) {
            return res.json({
                success: false,
                msg: 'plese select a valid payment option'
            })
        }


        let totalAmount = 0
        cart.items.forEach(items => {
            totalAmount += items.totalPrice
        })



        let subTotal = 0
        cart.items.forEach(item => {
            subTotal += item.totalPrice
        })
        console.log("ddddddddddddddddd")
        cart.items.forEach(item => {
            console.log("Product:", item.productId?.productName);
            console.log("Category:", item.productId?.category?.name);
        });
        const product = cart.items
        const currentDate = new Date()
        const allOffers = await Offer.find({
            status: 'Active',
            startDate: { $lt: currentDate },
            endDate: { $gte: currentDate }
        })
        console.log("alllofferssss :", allOffers)

        const result = cart.items.map((item) => {
            // console.log("itme--", item.productId.category._id)
            // console.log("itmiiiiie--", allOffers[0]._id)
            const offers = allOffers.filter(offer => {
                const targetId = offer.targetId?.toString();
                const productId = item.productId._id.toString();
                const categoryId = item.productId.category._id.toString(); // assuming populated or included

                return (
                    (offer.offerType === 'product' && targetId === productId) ||
                    (offer.offerType === 'category' && targetId === categoryId)
                );
            });
            const bestOffer = getBestOffer(offers, item);
            console.log('1111111',bestOffer,'1111')
            return {
                product: item,
                bestOffer,
                itemDiscount: (item.totalPrice * bestOffer.discountValue)/100  // NEW: Store individual discount

            }
        })

        console.log('1234567890',result,'00000000000');
        

        const totalDiscountBF = result.reduce((sum, item) => {
            const { bestOffer, product } = item
            let discount = 0
            if (bestOffer && bestOffer.discountValue > 0) {
                discount = (product.totalPrice * bestOffer.discountValue) / 100
            }
            return sum + discount
        }, 0)
        const totalDiscount = Math.floor(totalDiscountBF)
        let couponDiscount = 0
        if (req.session.appliedCoupon) {
            couponDiscount = Math.floor(((subTotal - totalDiscount) * req.session.appliedCoupon) / 100)

        }

        const finalAmount = totalAmount - totalDiscount - couponDiscount


        const orderItems = result.map(items => ({
            productId: items.product.productId,
            quantity: items.product.quantity,
            price: items.product.price,
            totalPrice: items.product.totalPrice,
            totalDiscount: items.itemDiscount
        }));
        console.log(orderItems)

        //    -----------------create razorpay-----------
        if (paymentOption === 'razorpay') {
            const razorpayOrder = await razorpay.orders.create({
                amount: (totalAmount - totalDiscount - couponDiscount) * 100, // Convert to paise
                currency: 'INR',
                // receipt: `order_rcptid_${req.user._id}_${Date.now()}`,
                receipt: 'receiptId',
                payment_capture: 1 // Auto-capture payment
            });
            console.log('just entered in reazor')
            req.session.offerResult = result
            return res.json({
                success: true,
                msg: 'Razorpay order created',
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID
                },
                orderDetails: {
                    userId: req.user._id,
                    address: cartAddress,
                    totalAmount,
                    totalDiscount,
                    couponDiscount,
                    finalAmount: (totalAmount - totalDiscount - couponDiscount),
                    cartItems: orderItems
                }
            });
        }


        if (paymentOption == 'wallet') {
            let wallet = await Wallet.findOne({ userId: req.user._id })
            if (!wallet) {
                wallet = new Wallet({
                    userId: req.user._id,
                    balance: 0,
                    transactions: []
                });
                await wallet.save()
                return res.json({
                    success: false,
                    msg: "Insufficient wallet balance"
                })
            }
            if (wallet.balance < finalAmount) {
                return res.json({
                    success: false,
                    msg: "Insufficient wallet balance"
                })
            }

            console.log("fffffffff", totalAmount)
            const newOrder = new Order({
                userId: req.user._id,
                orderItems: result.map(items => ({
                    productId: items.product.productId,
                    quantity: items.product.quantity,
                    price: items.product.price,
                    totalPrice: items.product.totalPrice,
                    totalDiscount: items.itemDiscount
                })),
                totalAmount: totalAmount,
                totalDiscount,
                couponDiscount,
                address: cartAddress,
                paymentMetherd: paymentOption,
                finalAmount: (totalAmount - totalDiscount - couponDiscount),
                status: 'Processing'
            })
            await newOrder.save()


            wallet.balance -= finalAmount
            wallet.transactions.push({
                amount: finalAmount,
                type: 'Debit',
                method: 'Order Payment',
                orderId: newOrder.orderId,
                date: new Date()
            })
            await wallet.save()
        } else if (paymentOption == 'cashOnDelivery') {

            if (finalAmount >= 1000) {
                return res.json({
                    success: false,
                    msg: 'Cash On delivery not availble above 1000'
                })
            }
            console.log("fffffffff", result,'kkkkkkkkkk')
            const newOrder = new Order({
                userId: req.user._id,
                orderItems: result.map(items => ({
                    productId: items.product.productId,
                    quantity: items.product.quantity,
                    price: items.product.price,
                    totalPrice: items.product.totalPrice,
                    totalDiscount: items.itemDiscount
                })),
                totalAmount: totalAmount,
                totalDiscount,
                couponDiscount,
                address: cartAddress,
                paymentMetherd: paymentOption,
                finalAmount: (totalAmount - totalDiscount - couponDiscount),
                status: 'Processing'
            })
            await newOrder.save()
            req.session.lastOrderId = newOrder._id

        }
        await Cart.updateOne({ userId: req.user._id },
            { $set: { items: [], } }
        )
        for (let item of cart.items) {
            const product = await Product.findById(item.productId._id)
            if (product) {
                product.stock -= item.quantity
                await product.save()
            }
        }
        req.session.orderSuccess = true

        res.json({
            success: true,
            msg: 'order compleated suceesfully ',
            redirectUrl: '/orderSuccess'
        })

        // return res.render("orderSuccess")
    } catch (error) {
        console.log("error in checkout page", error)
    }

}

const orderSuccess = async (req, res) => {
    console.log(req.user._id)
    const order = await Order.findOne({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .populate('orderItems.productId')

    console.log(order)

    if (req.session.orderSuccess) {
        req.session.orderSuccess = false;

        return res.render('orderSuccess', {
            order
        });
    } else {
        return res.redirect('/');
    }
};

const verifyPayment = async (req, res) => {
    try {
        // console.log("iiiiiiiiiiiiiii")
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderDetails } = req.body;
        // console.log("---------------------------------------")
        // console.log(orderDetails)
        // console.log("---------------------------")
        const crypto = require('crypto');
        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {

            return res.json({
                success: false,
                msg: 'Payment verification failed'

            });
        }
        console.log("--------------create order")
        let result = req.session.offerResult
        // Create order after successful payment
        const newOrder = new Order({
            userId: orderDetails.userId,
            orderItems: orderDetails.cartItems.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice,
                totalDiscount: item.totalDiscount
            })),
            totalAmount: orderDetails.totalAmount,
            address: orderDetails.address,
            paymentMetherd: 'razorpay',
            totalDiscount: orderDetails.totalDiscount,
            couponDiscount: orderDetails.couponDiscount,
            finalAmount: (orderDetails.totalAmount - orderDetails.totalDiscount - orderDetails.couponDiscount),
            status: 'Processing',
            razorpayDetails: {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            }
        });

        await newOrder.save();


        // Update product stock
        for (const item of orderDetails.cartItems) {
            const product = await Product.findById(item.productId._id);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // const failedOrder=await Order.findOne({userId:req.user._id,status:'paymentFailed'})
        // if(failedOrder){
        // failedOrder.status='orderFailed'
        // await failedOrder.save()
        // }
        // Clear cart
        await Cart.updateOne({ userId: orderDetails.userId }, { $set: { items: [] } });

        req.session.orderSuccess = true;
        req.session.lastOrderId = newOrder._id
        res.json({
            success: true,
            msg: 'Payment verified and order placed',
            redirectUrl: '/orderSuccess'
        });

    } catch (error) {
        console.log("Error in payment verification:", error);
        res.status(500).json({
            success: false,
            msg: 'Server error'
        });
    }
};
const orderFailed = async (req, res) => {
    try {
        const order = await Order.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
        res.render("orderFailed", {
            order
        })
    } catch (error) {
        console.log("error in orderFailed page", error)
    }
}


function getBestOffer(applicableOffers, product) {
    if (!Array.isArray(applicableOffers) || applicableOffers.length === 0) return null;

    let bestOffer = null;
    let maxDiscount = 0;

    const price = product.price || product.regularPrice || 0;

    if (price <= 0) {
        console.log(`Invalid price for product: ${product.productName}`);
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


const paymentFailed = async (req, res) => {
    try {
        console.log(req.body)
        const { orderDetails } = req.body
        const newOrder = new Order({
            userId: orderDetails.userId,
            orderItems: orderDetails.cartItems.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice
            })),
            totalAmount: orderDetails.totalAmount,
            address: orderDetails.address,
            paymentMetherd: 'razorpay',
            totalDiscount: orderDetails.totalDiscount,
            couponDiscount: orderDetails.couponDiscount,
            finalAmount: (orderDetails.totalAmount - orderDetails.totalDiscount - orderDetails.couponDiscount),
            status: 'paymentFailed',

        });
        console.log("[[[[[[[[[[[[[[[[[", newOrder)
        await newOrder.save();
        return res.json({
            success: true
        })
    } catch (error) {
        console.log("error in paymetn failed page ", error)
    }
}


const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body
        const userId = req.user._id

        console.log("lllllllllllllllllllllllllllllllllllllllllllllllllll")
        const order = await Order.findOne({ _id: orderId, userId, status: 'paymentFailed' })
        if (!order) {
            return res.json({
                success: false,
                msg: 'Order not found or not eligible for retry'
            })
        }

        for (const item of order.orderItems) {
            const product = await Product.findById(item.productId._id);
            if (product) {
                if (product.stock < item.quantity) {
                    return res.json({
                        success: false,
                        msg: "quantity exeed stock"
                    })

                }

            }
        }

        // Create a new Razorpay order for retry
        const razorpayOrder = await razorpay.orders.create({
            amount: order.finalAmount * 100, // Convert to paise
            currency: 'INR',
            receipt: order.orderId,
            payment_capture: 1 // Auto-capture payment
        });

        return res.json({
            success: true,
            msg: 'Retry payment order created',
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            },
            orderDetails: {
                orderId: order.orderId,
                finalAmount: order.finalAmount
            }
        });


    } catch (error) {
        console.log("error in retrypayment", error)
    }
}


const verifyRetryPayment = async (req, res) => {
    try {
        console.log("lllllllllllllllllllllllllllllllllllllllllllllllllll")

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
        const crypto = require('crypto');
        console.log(req.body)

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid payment signature'
            });
        }

        const order = await Order.findOne({ orderId: orderDetails.orderId })

        if (!order) {
            return res.status(404).json({
                success: false,
                msg: 'Order not found'
            });
        }


        for (const item of order.orderItems) {
            const product = await Product.findById(item.productId?._id || item.productId);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        order.status = 'Processing'
        order.razorpayDetails.
            paymentId = razorpay_payment_id
        await order.save();


        req.session.orderSuccess = true
        return res.json({
            success: true,
            msg: 'Payment verified and order updated'
        });

    } catch (error) {
        console.log("error in verify rtry Payment ", error)
    }
}
module.exports = {
    loadCheckout,
    checkout,
    orderSuccess,
    orderFailed,
    verifyPayment,
    paymentFailed,
    retryPayment,
    verifyRetryPayment
}