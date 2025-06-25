const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const SalesItems = require('../models/SalesItems');
const CashData = require('../models/CashData');
const Inventories = require('../models/Inventories');

// Helper: get month string (e.g. '2024-01')
function getMonthString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/reports/sales-summary?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/sales-summary', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all sales in range
    const sales = await Sales.find({ date: { $gte: startDate, $lte: endDate } });
    // Fetch all cash in range
    const cashData = await CashData.find({ date: { $gte: startDate, $lte: endDate } });

    // Group by month
    const summary = {};
    sales.forEach(sale => {
      const month = getMonthString(sale.date);
      if (!summary[month]) summary[month] = { sales: 0, cash: 0, profit: 0 };
      const saleAmount = Math.round(sale.amount - (sale.amount * (sale.special_less || 0) / 100));
      summary[month].sales += saleAmount;
    });
    cashData.forEach(cash => {
      const month = getMonthString(cash.date);
      if (!summary[month]) summary[month] = { sales: 0, cash: 0, profit: 0 };
      summary[month].cash += cash.amount;
    });
    // Profit: use grand total logic (sum profit for each sale)
    // For each sale, get its items and calculate profit
    for (const sale of sales) {
      const month = getMonthString(sale.date);
      const saleItems = await SalesItems.find({ sales_id: sale._id });
      let profit = 0;
      saleItems.forEach(item => {
        const saleAmount = item.quantity * item.rate;
        const discountAmount = saleAmount * (sale.special_less || 0) / 100;
        const finalSaleAmount = saleAmount - discountAmount;
        const costAmount = item.cost * item.quantity;
        const itemProfit = Math.round(finalSaleAmount - costAmount);
        profit += itemProfit;
      });
      summary[month].profit += profit;
    }
    // Format as array sorted by month
    const result = Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate sales summary report' });
  }
});

// GET /api/reports/items-sold?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/items-sold', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all sales in range
    const sales = await Sales.find({ date: { $gte: startDate, $lte: endDate } });
    // For each sale, get its items
    const itemsByMonth = {};
    for (const sale of sales) {
      const month = getMonthString(sale.date);
      if (!itemsByMonth[month]) itemsByMonth[month] = {};
      const saleItems = await SalesItems.find({ sales_id: sale._id });
      for (const item of saleItems) {
        if (!item.item_id) continue; // skip if item_id is missing
        const key = String(item.item_id);
        if (!itemsByMonth[month][key]) itemsByMonth[month][key] = 0;
        itemsByMonth[month][key] += item.quantity;
      }
    }
    // Get item names
    const allItemIds = Array.from(new Set(
      Object.values(itemsByMonth).flatMap(monthObj => Object.keys(monthObj))
    ));
    const itemDocs = await Inventories.find({ _id: { $in: allItemIds } });
    const itemIdToName = {};
    itemDocs.forEach(item => {
      itemIdToName[item._id] = `${item.length} ${item.gauge}`;
    });
    // Format result: [{ month, [itemName]: qty, ... }]
    const result = Object.entries(itemsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => {
        const row = { month };
        Object.entries(items).forEach(([itemId, qty]) => {
          const name = itemIdToName[itemId] || itemId;
          row[name] = qty;
        });
        return row;
      });
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate items sold report' });
  }
});

module.exports = router; 