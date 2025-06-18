const express = require('express');
const router = express.Router();
const CashData = require('../models/CashData');
const Customer = require('../models/Customer');
const Sales = require('../models/Sales');

// Function to update customer balance
async function updateCustomerBalance(customerId) {
  try {
    // Get the opening balance
    const customer = await Customer.findOne({ _id: customerId });
    if (!customer) {
      throw new Error('Customer not found');
    }

    let balance = customer.balance_bf; // Opening balance

    // Get all sales for this customer
    const sales = await Sales.find({ cust_id: customerId });
    
    // Calculate total sales amount
    let totalSales = 0;
    sales.forEach(sale => {
      const saleAmount = Math.round(sale.amount - (sale.amount * ((sale.special_less || 0) / 100)));
      totalSales += saleAmount;
    });

    // Add total sales to balance
    balance += totalSales;

    // Get all cash receipts for this customer
    const received = await CashData.find({ cust_id: customerId });
    
    // Calculate total received amount
    let totalReceived = 0;
    received.forEach(receipt => {
      totalReceived += receipt.amount;
    });

    // Subtract total received from balance
    balance -= totalReceived;

    // Update customer balance in database
    await Customer.findByIdAndUpdate(customerId, { balance: balance });

    return balance;
  } catch (error) {
    console.error("Error updating customer balance:", error);
    throw new Error("An error occurred while updating customer balance.");
  }
}

// Get all cash data with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [cashData, total] = await Promise.all([
      CashData.find()
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
        .sort({ inv_no: -1 })
        .skip(skip)
        .limit(limit),
      CashData.countDocuments()
    ]);

    res.json({ 
      cashData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get last invoice number
router.get('/last-invoice', async (req, res) => {
  try {
    const lastCash = await CashData.findOne()
      .sort({ inv_no: -1 })
      .select('inv_no');

    const nextInvoiceNo = lastCash ? lastCash.inv_no + 1 : 1;

    res.status(200).json({
      success: true,
      nextInvoiceNo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Search cash data by invoice number or customer name
router.get('/search', async (req, res) => {
    const { searchQuery } = req.query;
  
    try {
      let cashData = [];
  
      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Empty search query',
        });
      }
  
      const isNumeric = !isNaN(searchQuery);
      if (!isNumeric && searchQuery.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Please enter at least 3 characters for customer name search.',
        });
      }
  
      // If searchQuery is a number, try finding by inv_no
      if (isNumeric) {
        const cash = await CashData.findOne({ inv_no: Number(searchQuery) })
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
          });
  
        if (cash) cashData.push(cash);
      }
  
      // If no cash entry found by invoice number, or query is not numeric → search by customer name
      if (cashData.length === 0) {
        const customers = await Customer.find({
          customer_name: { $regex: searchQuery, $options: 'i' }
        }).populate({
          path: 'area_id',
          select: 'area_name group_id',
          populate: {
            path: 'group_id',
            select: 'area_group'
          }
        });
  
        if (customers.length > 0) {
          const customerIds = customers.map(c => c._id);
          cashData = await CashData.find({ cust_id: { $in: customerIds } })
            .sort({ inv_no: -1 }) // ✅ Properly sort by invoice number here
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
            });
        }
      }
  
      if (cashData.length > 0) {
        // Format the response data
        const formattedCashData = cashData.map(cash => {
          const customer = cash.cust_id;
          let customerNameWithAreaAndGroup = 'Unknown Customer';
  
          if (customer) {
            const area = customer.area_id;
            customerNameWithAreaAndGroup = area
              ? (area.group_id
                ? `${customer.customer_name} (${area.area_name} - ${area.group_id.area_group})`
                : `${customer.customer_name} (${area.area_name})`)
              : customer.customer_name;
          }
  
          return {
            ...cash.toObject(),
            customerNameWithAreaAndGroup
          };
        });
  
        res.status(200).json({
          success: true,
          cashData: formattedCashData
        });
      } else {
        res.status(404).json({ success: false, message: 'No cash entries found' });
      }
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
});
  

// Add new cash data
router.post('/', async (req, res) => {
  try {
    const { inv_no, date, cust_id, amount, detail } = req.body;

    // Validate required fields
    if (!inv_no || !date || !cust_id || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if customer exists
    const customer = await Customer.findById(cust_id)
      .populate({
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newCashData = new CashData({
      inv_no,
      date,
      cust_id,
      amount,
      detail
    });

    const savedCashData = await newCashData.save();
    
    // Update customer balance after adding cash data
    await updateCustomerBalance(cust_id);
    
    const populatedCashData = await CashData.findById(savedCashData._id)
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
      });

    res.status(201).json({ cashData: populatedCashData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cash data
router.put('/:id', async (req, res) => {
  try {
    const { inv_no, date, cust_id, amount, detail } = req.body;

    // Validate required fields
    if (!inv_no || !date || !cust_id || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if customer exists
    const customer = await Customer.findById(cust_id)
      .populate({
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCashData = await CashData.findByIdAndUpdate(
      req.params.id,
      {
        inv_no,
        date,
        cust_id,
        amount,
        detail
      },
      { new: true }
    ).populate({
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
    });

    if (!updatedCashData) {
      return res.status(404).json({ message: 'Cash data not found' });
    }

    // Update customer balance after updating cash data
    await updateCustomerBalance(cust_id);

    res.json({ cashData: updatedCashData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete cash data
router.delete('/:id', async (req, res) => {
  try {
    // Get the cash data before deleting to know which customer to update
    const cashData = await CashData.findById(req.params.id);
    if (!cashData) {
      return res.status(404).json({ message: 'Cash data not found' });
    }

    const customerId = cashData.cust_id;
    
    // Delete the cash data
    await CashData.findByIdAndDelete(req.params.id);
    
    // Update customer balance after deleting cash data
    await updateCustomerBalance(customerId);
    
    res.json({ message: 'Cash data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add bulk cash entries
router.post('/bulk', async (req, res) => {
  try {
    const { cashEntries } = req.body;
    if (!Array.isArray(cashEntries) || cashEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cash entries data'
      });
    }

    // Get the last invoice number
    const lastCash = await CashData.findOne()
      .sort({ inv_no: -1 })
      .select('inv_no');

    let nextInvoiceNo = lastCash ? lastCash.inv_no + 1 : 1;

    // Validate each entry
    for (const entry of cashEntries) {
      if (!entry.customer_id || !entry.amount || entry.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cash entry data'
        });
      }
    }

    // Map customer_id to cust_id for each entry and assign sequential invoice numbers
    const formattedEntries = cashEntries.map(entry => ({
      cust_id: entry.customer_id,
      amount: entry.amount,
      inv_no: nextInvoiceNo++,  // Increment invoice number for each entry
      date: entry.date,
      detail: entry.detail
    }));

    // Create cash entries
    const createdEntries = await CashData.insertMany(formattedEntries);

    // Get unique customer IDs to update their balances
    const uniqueCustomerIds = [...new Set(formattedEntries.map(entry => entry.cust_id))];
    
    // Update customer balances for all affected customers
    for (const customerId of uniqueCustomerIds) {
      await updateCustomerBalance(customerId);
    }

    // Populate customer data for response
    const populatedEntries = await CashData.find({
      _id: { $in: createdEntries.map(entry => entry._id) }
    }).populate({
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
    });

    // Format response
    const formattedResponse = populatedEntries.map(cash => {
      const customer = cash.cust_id;
      let customerNameWithAreaAndGroup = 'Unknown Customer';

      if (customer) {
        const area = customer.area_id;
        customerNameWithAreaAndGroup = area
          ? (area.group_id
            ? `${customer.customer_name} (${area.area_name} - ${area.group_id.area_group})`
            : `${customer.customer_name} (${area.area_name})`)
          : customer.customer_name;
      }

      return {
        ...cash.toObject(),
        customerNameWithAreaAndGroup
      };
    });

    res.status(201).json({
      success: true,
      cashData: formattedResponse
    });
  } catch (error) {
    console.error('Error creating bulk cash entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bulk cash entries'
    });
  }
});

module.exports = router; 