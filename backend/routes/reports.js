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

function toLocalDate(dateStr, h, m, s, ms) {
  const d = new Date(dateStr + 'T00:00:00'); // force local time
  d.setHours(h, m, s, ms);
  return d;
}

// GET /api/reports/sales-summary?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/sales-summary', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');

    // Fetch all sales in range
    const sales = await Sales.find({ date: { $gte: startDateTime, $lte: endDateTime } });
    // Fetch all cash in range
    const cashData = await CashData.find({ date: { $gte: startDateTime, $lte: endDateTime } });

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
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');

    // Fetch all sales in range
    const sales = await Sales.find({ date: { $gte: startDateTime, $lte: endDateTime } });
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
    // Get item names and sequence
    const allItemIds = Array.from(new Set(
      Object.values(itemsByMonth).flatMap(monthObj => Object.keys(monthObj))
    ));
    const itemDocs = await Inventories.find({ _id: { $in: allItemIds } });
    const itemIdToInfo = {};
    itemDocs.forEach(item => {
      itemIdToInfo[item._id] = {
        name: `${item.length} ${item.gauge}`,
        sequence: item.sequence
      };
    });
    // Format result: [{ month, items: [{ name, quantity, sequence }, ...] }]
    const result = Object.entries(itemsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => {
        const itemsArr = Object.entries(items).map(([itemId, qty]) => {
          const info = itemIdToInfo[itemId] || { name: itemId, sequence: '' };
          return {
            name: info.name,
            quantity: qty,
            sequence: info.sequence || ''
          };
        });
        return { month, items: itemsArr };
      });
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate items sold report' });
  }
});

module.exports = router; 