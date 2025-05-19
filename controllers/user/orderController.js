const User =require("../../models/userSchema")
const Order =require("../../models/orderSchema")
const Product=require("../../models/productSchema")
const Wallet=require("../../models/walletSchema")
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const loadOrders=async(req,res)=>{

    try {
        if(!req.session.user){
            res.reditect("/singup")
        }

        
        let search =""
        if(req.query.search){
            search=req.query.search
        }
        
        const page =parseInt(req.query.page)||1
        const limit =10
        const skip=(page-1)*limit
    //    console.log("userin ord", req.user._id)
        const order=await Order.find({
            userId:req.user._id,
            $or: [
                { orderId: { $regex: search, $options: "i" } },
            ]
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('orderItems.productId')
        .populate('userId')

        console.log(order)

        
        if(!order){
            
            msg='Cart is Empty'
        }
        // console.log("order",order)

        const count=await Order.find({$or: [
            { orderId: { $regex: search, $options: "i" } },
                ]}).countDocuments()
                const totalCategories=count
                const totalPages = Math.ceil(count/limit)
                const startItem = skip + 1;
                const endItem = Math.min(skip + limit, count);
        res.render("orders",{
            order,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            startItem:startItem,
            endItem:endItem,
            search:search,
            
        })
        
    } catch (error) {
        
    }
}
const loadOrederDetails=async(req,res)=>{
    try {
         const id=req.query.id
            const order= await Order.findById(id).populate('orderItems.productId')
            // console.log(order)
            if(!order){
                return res.json({
                    success:false,
                    msg:"not order as per id"
                })
            }
            return res.render("orderDetailsPage",{
                order
            })
    } catch (error) {
        console.log("error in loadOrderDetails page",error)
    }
}
const cancelOrder=async (req,res)=>{
    console.log("lllllllllllll")
    console.log(req.body)

    const userId=req.user._id

    const {status,orderId,reason}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Cancelled'){
            return res.json({
                success:false,
                msg:'plese choose valid status'
            })
        }
        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }

        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        // console.log("fjjjjjf",order)
        order.status=status
        order.cancelReason=reason
        await order.save()
        let refundAmount=0
        for(let item of order.orderItems){
            if(item.status!=='Cancelled'&&item.status!=='Returned'){
                refundAmount+=(item.totalPrice-item.totalDiscount)
            const product=await Product.findById(item.productId)

            if(product){
                product.stock+=item.quantity
                await product.save()
            }

        }
    }
let wallet= await Wallet.findOne({userId})
if (!wallet) {
    wallet = new Wallet({
        userId,
        balance: refundAmount,
        transactions: [{
            amount: refundAmount,
            type: 'Credit',
            method: 'Refund',
            orderId: orderId, // If available
            date: new Date()
        }]
    });
} else {
    wallet.balance += refundAmount;
    wallet.transactions.push({
        amount: refundAmount,
        type: 'Credit',
        method: 'Refund',
        orderId: orderId, 
        date: new Date()
    });
}

await wallet.save();
        res.json({
            success:true,
            msg:'Order cancelled successfully'
        })
    } catch (error) {
        console.log("error in cancelOrder ",error)
    }
}
const returnRequestOrder=async (req,res)=>{
    const {status,orderId,reason}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Return-requested'){
            return res.json({
                success:false,
                msg:'plese choose valid request'
            })
        }
        if(order.status=='Cancelled'){
            // console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already  cancelled"
            })
        }
        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        order.status=status
        order.returnReason=reason
        await order.save()
        res.json({
            success:true,
            msg:'requested for return'
        })


    } catch (error) {
        console.log("error in return order page",error)
    }
   
}

const cancelProduct=async(req,res)=>{
    console.log("cancell product",req.body)
    const userId=req.user._id
    const {status,orderId,reason,productId}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Cancelled'){
            return res.json({
                success:false,
                msg:'plese choose valid status'
            })
        }
        if(order.status=='Deliverd'||order.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already delivered or cancelled"
            })
        }

        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        

        const item=order.orderItems.find(item=>item.productId.toString()==productId)
        // console.log("fjjjjjf",item)
        if(!item){
            res.json({
                success:false,
                msg:'product not found'
            })
        }

        if(item.status=='Deliverd'||item.status=='Cancelled'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"product already delivered or cancelled"
            })
        }

        item.status=status
        item.cancelReason=reason
        await order.save()
        const product= await Product.findById(item.productId)
        if(product){
            product.stock+=item.quantity
            await product.save()
        }
        let refundAmount= (item.totalPrice-item.totalDiscount)
        
        let wallet= await Wallet.findOne({userId})
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: refundAmount,
                transactions: [{
                    amount: refundAmount,
                    type: 'Credit',
                    method: 'Refund',
                    orderId: orderId, // If available
                    date: new Date()
                }]
            });
        } else {
            wallet.balance += refundAmount;
            wallet.transactions.push({
                amount: refundAmount,
                type: 'Credit',
                method: 'Refund',
                orderId: orderId, 
                date: new Date()
            });
        }
        await wallet.save()


        const allItemCancelled= order.orderItems.every(item=> item.status=='Cancelled')

        if(allItemCancelled){
            order.status='Cancelled'
            await order.save()
        }

        res.json({
            success:true,
            msg:'product cancelled successfully'
        })

    } catch (error) {
        console.log("error in cancellProduct ",error)
        
    }
}

const returnRequestProduct=async(req,res)=>{
    const {status,orderId,reason,productId}=req.body
    try {
        const order= await Order.findById(orderId)
        if(!order){
           return res.json({
                success:false,
                msg:"order not found"
            })
        }
        if(!status=='Return-requested'){
            return res.json({
                success:false,
                msg:'plese choose valid request'
            })
        }
        if(order.status=='Return-requested'){
            // console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"order already  cancelled"
            })
        }
        if(!reason.trim()){
            return res.json({
                success:false,
                msg:'plese enter a valid reason'
            })
        }
        
        const item=order.orderItems.find(item=>item.productId.toString()==productId)
        // console.log("fjjjjjf",item)
        if(!item){
            res.json({
                success:false,
                msg:'product not found'
            })
        }

        if(order.status!=='Deliverd'){
            console.log("dddddddddd")
            return res.json({
                success:false,
                msg:"product not delivered "
            })
        }
        if(item.status=="Return-requested"){
            return res.json({
                success:false,
                msg:"product already retruned"
            })
        }

        item.status=status
        item.returnReason=reason
        await order.save()


        const allItemRetrunRequested= order.orderItems.every(item=> item.status=='Return-requested')

        if(allItemRetrunRequested){
            order.status='Return-requested'
            await order.save()
        }
        res.json({
            success:true,
            msg:'requested for return'
        })


    } catch (error) {
        console.log("error in return product page",error)
    }
   
}
const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.query.orderId;
      console.log("Processing invoice download for order:", orderId);
      
      // Find the order with populated product details
      const order = await Order.findById(orderId)
        .populate({
          path: 'orderItems.productId',
          select: 'productName productImage varient regularPrice' // Include all needed fields
        })
        .populate({
          path: 'userId',
          select: 'name email'
        });
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      // Check if user has permission to access this invoice (assuming req.user._id is available from auth middleware)
      if (req.user && order.userId && order.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      // Create a PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Invoice - ${order.orderId}`,
          Author: 'Nutify',
          Subject: 'Invoice'
        }
      });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
      
      // Pipe the PDF to the response
      doc.pipe(res);
      
      // Generate the invoice content
      generateInvoice(doc, order);
      
      // Finalize the PDF and end the response
      doc.end();
      
      // Update order.invoiceDate if it hasn't been set
      if (!order.invoiceDate) {
        order.invoiceDate = new Date();
        await order.save();
      }
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ success: false, message: 'Error generating invoice', error: error.message });
    }
  };
  
  function generateInvoice(doc, order) {
    // Helper for formatting currency
    const formatCurrency = (amount) => {
      return `${parseFloat(amount || 0).toFixed(2)}`;
    };
    
    // Define colors for a professional look
    const primaryColor = '#333333';
    const accentColor = '#2c3e50';
    const lightGray = '#f9f9f9';
    const borderColor = '#e0e0e0';
    
    // Set text color
    doc.fillColor(primaryColor);

   
    // Add logo and header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${order.orderId}`, { align: 'right' });
    doc.moveDown(0.8);
    
    // Draw a separator line
    doc.strokeColor(accentColor).lineWidth(1)
       .moveTo(50, doc.y).lineTo(550, doc.y)
       .stroke();
    doc.moveDown(1);
    
    // Company information on the left
    const companyInfoY = doc.y;
    doc.font('Helvetica-Bold').fontSize(14).text('Nutify', 50, companyInfoY);
    doc.font('Helvetica').fontSize(10);
    doc.text('Nutify Hub, Mavoor', 50, doc.y + 5);
    doc.text('Kozhikode, Kerala, 673661', 50, doc.y + 5);
    doc.text('Email: support@nutify.com', 50, doc.y + 5);
    doc.text('Phone: +91 8137822686', 50, doc.y + 5);
    doc.moveDown(0.5);
    
    // Invoice details on the right
    doc.font('Helvetica-Bold').fontSize(10).text('INVOICE DETAILS:', 350, companyInfoY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Date: ${order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 350, doc.y + 5);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, doc.y + 5);
    doc.text(`Payment Method: ${order.paymentMetherd || 'Online Payment'}`, 350, doc.y + 5);
    
    doc.moveDown(3);
    
    // Billing and shipping information
    doc.font('Helvetica-Bold').fontSize(12).text('BILL TO:', 50);
    doc.font('Helvetica').fontSize(10);
    doc.text(`${order.address.name || 'Customer'}`, 50, doc.y + 5);
    doc.text(`${order.address.address || ''}`, 50, doc.y + 5);
    doc.text(`${order.address.postOffice || ''}, ${order.address.district || ''}`, 50, doc.y + 5);
    doc.text(`${order.address.state || ''} - ${order.address.pincode || ''}`, 50, doc.y + 5);
    doc.text(`Phone: ${order.address.phone || ''}`, 50, doc.y + 5);
    if (order.address.altPhone) {
      doc.text(`Alternative Phone: ${order.address.altPhone}`, 50, doc.y + 5);
    }
    
    doc.moveDown(1.5);
    
    // Create order items table
    const tableTop = doc.y;
    const tableHeaders = ['Item', 'Variant', 'Qty', 'Price', 'Discount', 'Total'];
    const tableColumnWidths = [120, 50, 50, 70, 70, 70];
    
    // Draw table header
    doc.fillColor(accentColor).rect(50, tableTop, 500, 20).fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
    
    let xPosition = 50;
    tableHeaders.forEach((header, i) => {
      const width = tableColumnWidths[i];
      const align = i === 0 ? 'left' : 'right';
      const padding = i === 0 ? 5 : 0;
      doc.text(header, xPosition + padding, tableTop + 5, { width: width, align });
      xPosition += width;
    });
    
    // Draw table rows
    let y = tableTop + 25;
    doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
    
    // Check if orderItems exists and is an array
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach((item, i) => {
        // Reset x position for each row
        xPosition = 50;
        
        // Alternate row background for readability
        if (i % 2 === 0) {
          doc.fillColor(lightGray).rect(50, y - 5, 500, 20).fill();
          doc.fillColor(primaryColor);
        }
        
        // Get product name safely - handle cases where productId might be missing or incomplete
        let productName = 'Product';
        let variantText = item.varient || '';
        
        if (item.productId) {
          // Check if productId is populated as an object or just an ID
          if (typeof item.productId === 'object' && item.productId !== null) {
            productName = item.productId.productName || 'Product';
            variantText = item.varient || item.productId.varient || '';
          }
        }
        
        // Ensure we have values for all fields or use defaults
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const totalDiscount = item.totalDiscount || 0;
        const totalPrice = item.totalPrice || 0;
        
        // Item column
        doc.text(productName, xPosition + 5, y, { width: tableColumnWidths[0] - 5, ellipsis: true });
        xPosition += tableColumnWidths[0];
        
        // Variant column
        doc.text(variantText, xPosition, y, { width: tableColumnWidths[1], align: 'right' });
        xPosition += tableColumnWidths[1];
        
        // Quantity column
        doc.text(quantity.toString(), xPosition, y, { width: tableColumnWidths[2], align: 'right' });
        xPosition += tableColumnWidths[2];
        
        // Price column
        doc.text(formatCurrency(price), xPosition, y, { width: tableColumnWidths[3], align: 'right' });
        xPosition += tableColumnWidths[3];
        
        // Discount column
        doc.text(formatCurrency(order.totalDiscount || 0), xPosition, y, { width: tableColumnWidths[4], align: 'right' });
        xPosition += tableColumnWidths[4];
        
        // Total column
        doc.text(formatCurrency(price-order.totalDiscount ), xPosition, y, { width: tableColumnWidths[5], align: 'right' });
        
        y += 20; // Move to next row
      });
    } else {
      doc.text('No items found in this order', 50, y);
      y += 20;
    }
    
    // Draw line under the items table
    doc.strokeColor(borderColor).lineWidth(0.5)
       .moveTo(50, y).lineTo(550, y)
       .stroke();
    
    // Calculate totals - with a more compact and organized structure
    const totalSectionTop = y + 15;
    const totalSectionWidth = 250;
    const totalX = 300; // X position start for totals section
    
    // Draw a box for the totals section
    doc.strokeColor(borderColor).lineWidth(0.75)
       .rect(totalX, totalSectionTop, totalSectionWidth, 130)
       .stroke();
    
    // Add totals section header
    doc.fillColor(accentColor).rect(totalX, totalSectionTop, totalSectionWidth, 25).fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12)
       .text('ORDER SUMMARY', totalX + 10, totalSectionTop + 7, { width: totalSectionWidth - 20, align: 'center' });
    
    let totalY = totalSectionTop + 35;
    const leftColX = totalX + 10;
    const rightColX = totalX + 140;
    const lineHeight = 20;
    
    // Reset text color to primary
    doc.fillColor(primaryColor);
    
    // Total Amount (Original Price)
    doc.font('Helvetica').fontSize(10)
       .text('Total Amount:', leftColX, totalY);
    doc.text(formatCurrency(order.totalAmount || 0), rightColX, totalY, { align: 'right', width: 100 });
    totalY += lineHeight;
    
    // Total Discount
    doc.text('Total Discount:', leftColX, totalY);
    doc.text(`- ${formatCurrency(order.totalDiscount || 0)}`, rightColX, totalY, { align: 'right', width: 100 });
    totalY += lineHeight;
    
    // Coupon Discount (if any)
    if (order.couponDiscount && order.couponDiscount > 0) {
      doc.text('Coupon Discount:', leftColX, totalY);
      doc.text(`- ${formatCurrency(order.couponDiscount)}`, rightColX, totalY, { align: 'right', width: 100 });
      totalY += lineHeight;
    }
    
    // Add a separator line before final amount
    doc.strokeColor(borderColor).lineWidth(0.5)
       .moveTo(leftColX, totalY + 5).lineTo(totalX + totalSectionWidth - 10, totalY + 5)
       .stroke();
    totalY += lineHeight;
    
    // Final Amount (in bold)
    doc.font('Helvetica-Bold').fontSize(12)
       .text('FINAL AMOUNT:', leftColX, totalY);
    doc.text(formatCurrency(order.finalAmount || 0), rightColX, totalY, { align: 'right', width: 100 });
    
    // Add footer
    addFooter(doc);
  }
  
  function addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer position
      const footerTop = doc.page.height - 50;
      
      // Add a divider line above footer
      doc.strokeColor('#e0e0e0').lineWidth(0.5)
         .moveTo(50, footerTop - 10).lineTo(550, footerTop - 10)
         .stroke();
      
      // Add footer text
      doc.fillColor('#666666').fontSize(9).font('Helvetica')
         .text('Thank you for shopping with Nutify!', 50, footerTop, { align: 'center', width: 500 });
      
     
    }
  }


module.exports={
    loadOrders,
    loadOrederDetails,
    cancelOrder,
    returnRequestOrder,
    cancelProduct,
    returnRequestProduct,
    downloadInvoice
   
    
}