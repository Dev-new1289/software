const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const SalesItems = require('../models/SalesItems');

// Get grand total profit for a date range
router.get('/grand-total', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Create proper date range to include full days (UTC)
    const startDateTime = new Date(startDate + 'T00:00:00.000Z'); // Start of day UTC
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');   // End of day UTC

    // Get all sales items for the date range
    const sales = await Sales.find({
      date: {
        $gte: startDateTime,
        $lte: endDateTime
      }
    }).select('_id special_less');

    // Get all items for these sales
    const items = await SalesItems.find({
      sales_id: { $in: sales.map(s => s._id) },
      quantity: { $gt: 0 }
    }).select('sales_id quantity rate cost');

    // Calculate total profit
    const totalProfit = items.reduce((sum, item) => {
      const sale = sales.find(s => s._id.toString() === item.sales_id.toString());
      const saleAmount = item.quantity * item.rate;
      const discountAmount = saleAmount * (sale?.special_less || 0) / 100;
      const finalSaleAmount = saleAmount - discountAmount;
      const costAmount = item.cost * item.quantity;
      const profit = Math.round(finalSaleAmount - costAmount);
      return sum + profit;
    }, 0);

    res.json({
      success: true,
      grandTotalProfit: totalProfit
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating grand total'
    });
  }
});

// Get income report data
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Create proper date range to include full days (UTC)
    const startDateTime = new Date(startDate + 'T00:00:00.000Z'); // Start of day UTC
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');   // End of day UTC

    // Get total count of sales for pagination
    const totalSales = await Sales.countDocuments({
      date: {
        $gte: startDateTime,
        $lte: endDateTime
      }
    });

    const totalPages = Math.ceil(totalSales / itemsPerPage);
    const isLastPage = currentPage === totalPages;

    // Get sales data with populated customer, area, and group information
    const sales = await Sales.find({
      date: {
        $gte: startDateTime,
        $lte: endDateTime
      }
    })
    .populate({
      path: 'cust_id',
      select: 'customer_name area_id',
      populate: {
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      }
    })
    .sort({ date: 1 })
    .skip(skip)
    .limit(itemsPerPage);

    // Process each sale to include items and calculate profits
    const processedSales = await Promise.all(sales.map(async (sale) => {
      try {
        // Get sale items with inventory details, excluding items with zero quantity
        const items = await SalesItems.find({ 
          sales_id: sale._id,
          quantity: { $gt: 0 }
        })
          .populate({
            path: 'item_id',
            model: 'Inventories',
            select: 'length gauge sequence'
          })
          .sort({ 'item_id.sequence': 1 });

        // Calculate profit for each item
        const processedItems = items.map(item => {
          try {
            const saleAmount = item.quantity * item.rate;
            const discountAmount = saleAmount * (sale.special_less || 0) / 100;
            const finalSaleAmount = saleAmount - discountAmount;
            const costAmount = item.cost * item.quantity;
            const profit = Math.round(finalSaleAmount - costAmount);

            return {
              itemId: item.item_id?._id || 'Unknown',
              name: item.item_id ? `${item.item_id.length || 'Unknown'} ${item.item_id.gauge || 'Unknown'}` : 'Unknown Item',
              quantity: item.quantity || 0,
              rate: item.rate || 0,
              amount: saleAmount || 0,
              saleAmount: finalSaleAmount || 0,
              cost: item.cost || 0,
              profit: profit || 0
            };
          } catch (itemError) {
            return {
              itemId: 'Unknown',
              name: 'Unknown Item',
              quantity: 0,
              rate: 0,
              amount: 0,
              saleAmount: 0,
              cost: 0,
              profit: 0
            };
          }
        });

        // Calculate total profit for the sale
        const totalProfit = processedItems.reduce((sum, item) => sum + (item.profit || 0), 0);

        // Format customer name with fallbacks
        const customerName = sale.cust_id ? 
          `${sale.cust_id.customer_name || 'Unknown Customer'} ${sale.cust_id.area_id?.area_name || ''} ${sale.cust_id.area_id?.group_id?.area_group || ''}`.trim() :
          'Unknown Customer';

        return {
          saleId: sale.sale_id || 'Unknown',
          date: sale.date || new Date(),
          customerName: customerName,
          amount: sale.amount || 0,
          specialLess: sale.special_less || 0,
          remarks: sale.remarks || '',
          items: processedItems,
          profit: totalProfit
        };
      } catch (saleError) {
        return {
          saleId: 'Unknown',
          date: new Date(),
          customerName: 'Unknown Customer',
          amount: 0,
          specialLess: 0,
          remarks: '',
          items: [],
          profit: 0
        };
      }
    }));

    // Calculate page total profit
    const pageTotalProfit = processedSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

    res.json({
      success: true,
      sales: processedSales,
      pageTotalProfit,
      pagination: {
        currentPage,
        totalPages,
        totalSales,
        limit: itemsPerPage,
        isLastPage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching income report data'
    });
  }
});

module.exports = router; 