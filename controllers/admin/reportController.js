const Order = require("../../models/orderSchema")
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const downloadExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    // Define date range
    let dateFilter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (reportType) {
      case 'daily':
        dateFilter = {
          createdAt: {
            $gte: today,
            $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        };
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFilter = {
          createdAt: {
            $gte: weekStart,
            $lte: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFilter = {
          createdAt: {
            $gte: monthStart,
            $lte: new Date(today.getFullYear(), today.getMonth() + 1, 0),
          },
        };
        break;
      case 'yearly':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        dateFilter = {
          createdAt: {
            $gte: yearStart,
            $lte: new Date(today.getFullYear(), 11, 31),
          },
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
            },
          };
        }
        break;
      default:
        dateFilter = { createdAt: { $gte: today } };
    }

    const orders = await Order.find({ ...dateFilter, status: { $ne: 'paymentFailed' } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Date', key: 'invoiceDate', width: 15 },
      { header: 'Customer', key: 'customerName', width: 20 },
      { header: 'Amount', key: 'totalAmount', width: 12 },
      { header: 'Discount', key: 'totalDiscount', width: 12 },
      { header: 'Final Amount', key: 'finalAmount', width: 12 },
      { header: 'Payment', key: 'paymentMetherd', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        invoiceDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        customerName: order.userId?.name || order.address.name || 'Unknown',
        totalAmount: order.totalAmount,
        totalDiscount: order.totalDiscount + order.couponDiscount,
        finalAmount: order.finalAmount,
        paymentMetherd: order.paymentMetherd,
        status: order.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating Excel' });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    // Define date range
    let dateFilter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (reportType) {
      case 'daily':
        dateFilter = {
          createdAt: {
            $gte: today,
            $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        };
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFilter = {
          createdAt: {
            $gte: weekStart,
            $lte: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFilter = {
          createdAt: {
            $gte: monthStart,
            $lte: new Date(today.getFullYear(), today.getMonth() + 1, 0),
          },
        };
        break;
      case 'yearly':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        dateFilter = {
          createdAt: {
            $gte: yearStart,
            $lte: new Date(today.getFullYear(), 11, 31),
          },
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
            },
          };
        }
        break;
      default:
        dateFilter = { createdAt: { $gte: today } };
    }

    const orders = await Order.find({ ...dateFilter, status: { $ne: 'paymentFailed' } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(16).text('Sales Report', { align: 'center' });
    doc.moveDown();

    orders.forEach((order, index) => {
      doc.fontSize(12).text(`Order ${index + 1}`);
      doc.fontSize(10).text(`Order ID: ${order.orderId}`);
      doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`);
      doc.text(`Customer: ${order.userId?.name || order.address.name || 'Unknown'}`);
      doc.text(`Amount: ₹${order.totalAmount.toLocaleString('en-IN')}`);
      doc.text(`Discount: ₹${(order.totalDiscount + order.couponDiscount).toLocaleString('en-IN')}`);
      doc.text(`Final Amount: ₹${order.finalAmount.toLocaleString('en-IN')}`);
      doc.text(`Payment: ${order.paymentMetherd}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

module.exports={
    downloadExcel,
    downloadPDF
}