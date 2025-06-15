const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const CashData = require('../models/CashData');
const Customer = require('../models/Customer');

// Get customer ledger data
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get customer details
    const customer = await Customer.findById(customerId)
      .populate({
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate previous balance using the same logic as customer.js
    let previousBalance = customer.balance_bf || 0; // Start with opening balance

    // Get previous sales
    const previousSales = await Sales.find({
      cust_id: customerId,
      date: { $lt: new Date(startDate) }
    });

    // Calculate total previous sales
    let totalPreviousSales = 0;
    previousSales.forEach(sale => {
      const saleAmount = Math.round(sale.amount - (sale.amount * (sale.special_less || 0) / 100));
      totalPreviousSales += saleAmount;
    });

    // Add total previous sales to balance
    previousBalance += totalPreviousSales;

    // Get previous cash received
    const previousCash = await CashData.find({
      cust_id: customerId,
      date: { $lt: new Date(startDate) }
    });

    // Calculate total previous cash received
    let totalPreviousCash = 0;
    previousCash.forEach(receipt => {
      totalPreviousCash += receipt.amount;
    });

    // Subtract total previous cash from balance
    previousBalance -= totalPreviousCash;

    // Get sales data for the period
    const salesData = await Sales.find({
      cust_id: customerId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Get cash data for the period
    const cashData = await CashData.find({
      cust_id: customerId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Combine and format data
    const ledgerData = [];

    // Add previous balance as first entry
    ledgerData.push({
      date: new Date(startDate),
      description: 'Previous Balance',
      sales: null,
      received: null,
      balance: previousBalance,
      type: 'opening'
    });

    // Add sales entries
    salesData.forEach(sale => {
      const amount = Math.round(sale.amount - (sale.amount * (sale.special_less || 0) / 100));
      ledgerData.push({
        date: sale.date,
        description: `Sales Inv. ${sale.sale_id}`,
        sales: amount,
        received: null,
        type: 'sale'
      });
    });

    // Add cash entries
    cashData.forEach(cash => {
      ledgerData.push({
        date: cash.date,
        description: `Cash Received Inv. ${cash.inv_no}`,
        sales: null,
        received: cash.amount,
        type: 'cash'
      });
    });

    // Sort by date
    ledgerData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = previousBalance;
    ledgerData.forEach(entry => {
      if (entry.type !== 'opening') {
        balance += (entry.sales || 0) - (entry.received || 0);
        entry.balance = balance;
      }
    });

    res.json({
      success: true,
      customer: {
        name: customer.customer_name,
        area: customer.area_id?.area_name || 'N/A',
        group: customer.area_id?.group_id?.area_group || 'N/A'
      },
      ledgerData
    });

  } catch (error) {
    console.error('Error fetching ledger data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ledger data'
    });
  }
});

module.exports = router; 