const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Sales = require('../models/Sales');
const CashData = require('../models/CashData');
const SalesItems = require('../models/SalesItems');
const Area = require('../models/Area');
const AreaGroup = require('../models/AreaGroup');

// Get all areas
router.get('/areas', async (req, res) => {
  try {
    const areas = await Area.find()
      .populate('group_id')
      .sort({ area_name: 1 });

    const transformedAreas = areas.map(area => ({
      _id: area._id,
      area_id: area.area_id,
      area_name: area.area_name,
      group_id: area.group_id._id,
      group_name: area.group_id.area_group
    }));

    res.json({ areas: transformedAreas });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate({
        path: 'area_id',
        populate: {
          path: 'group_id',
          model: 'AreaGroup'
        }
      })
      .sort({ customer_name: 1 });

    // Transform the data to include combined area information
    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      area_id: customer.area_id,
      customer_name: customer.customer_name,
      area_name: customer.area_id ? `${customer.area_id.area_name} (${customer.area_id.group_id.area_group})` : '',
      balance_bf: customer.balance_bf,
      balance: customer.balance,
      less: customer.less,
      phone: customer.phone
    }));

    res.json({ customers: transformedCustomers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all customers with calculated balance
router.get('/balance', async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate({
        path: 'area_id',
        populate: {
          path: 'group_id',
          model: 'AreaGroup'
        }
      })
      .sort({ customer_name: 1 });


    const transformedCustomers = await Promise.all(customers.map(async customer => {
      return {
        _id: customer._id,
        area_id: customer.area_id,
        customer_name: customer.customer_name,
        area_name: customer.area_id ? `${customer.area_id.area_name} (${customer.area_id.group_id.area_group})` : '',
        balance_bf: customer.balance_bf,
        balance: customer.balance,
        less: customer.less,
        phone: customer.phone
      };
    }));

    res.json({ customers: transformedCustomers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer({
      customer_name: req.body.customer_name,
      area_id: req.body.area_id,
      balance_bf: req.body.balance_bf || 0,
      balance: req.body.balance || 0,
      less: req.body.less || 0,
      phone: req.body.phone,
      sales: 0,
      received: 0
    });

    const newCustomer = await customer.save();
    res.status(201).json({ customer: newCustomer });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.customer_name = req.body.customer_name;
    customer.area_id = req.body.area_id;
    customer.balance_bf = req.body.balance_bf;
    customer.balance = req.body.balance;
    customer.less = req.body.less;
    customer.phone = req.body.phone;

    const updatedCustomer = await customer.save();
    res.json({ customer: updatedCustomer });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete the customer
    await customer.deleteOne();
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:customerId/details', async (req, res) => {
    const { customerId } = req.params;
    const { date, invoiceId } = req.query;


    try {
      const customer = await Customer.findById(customerId).populate({
        path: 'area_id',
        populate: {
          path: 'group_id',
          model: 'AreaGroup'
        }
      });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      const areaName = customer.area_id ? 
        `${customer.area_id.area_name} ${customer.area_id.group_id.area_group}` : '';
  
      const previousBalanceData = await getCustomerBalance(customerId, date, invoiceId);
  
      const previousBalance = previousBalanceData ? previousBalanceData : 0;
  
      res.json({
        area: areaName,
        less: customer.less,
        balance: previousBalance,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
});



  async function getCustomerBalance(customerId, endDate, excludeInvoiceId = null) {
    let balance = 0;
  
    try {
      // Get the opening balance
      const customer = await Customer.findOne({ _id: customerId });
      if (customer) {
        balance = customer.balance_bf; // Opening balance
      } else {
        return balance; // Return 0 if customer not found
      }
  
      // Build sales query
      const salesQuery = { cust_id: customerId };
      if (endDate) {
        salesQuery.date = { $lte: new Date(endDate) };
      }
      if (excludeInvoiceId) {
        salesQuery._id = { $ne: excludeInvoiceId };
      }
      const sales = await Sales.find(salesQuery);
  
      // Calculate total sales amount
      let totalSales = 0;
      sales.forEach(sale => {
        const saleAmount = Math.round(sale.amount - (sale.amount * (sale.special_less || 0) / 100));
        totalSales += saleAmount;
      });
  
      // Add total sales to balance
      balance += totalSales;
  
      // Build cash (received) query
      const receivedQuery = { cust_id: customerId };
      if (endDate) {
        receivedQuery.date = { $lte: new Date(endDate) };
      }
      const received = await CashData.find(receivedQuery);
  
      // Calculate total received amount
      let totalReceived = 0;
      received.forEach(receipt => {
        totalReceived += receipt.amount;
      });
  
      // Subtract total received from balance
      balance -= totalReceived;
  
      // Return the final balance
      return balance; // Return balance as a number
    } catch (error) {
      console.error("Error calculating customer balance:", error);
      throw new Error("An error occurred while calculating customer balance.");
    }
  }

// Area Group Routes
router.get('/area-groups', async (req, res) => {
  try {
    const groups = await AreaGroup.find().sort({ area_group: 1 });
    // Transform the data to match the expected format
    const transformedGroups = groups.map(group => ({
      _id: group._id,
      group_id: group.group_id,
      area_group: group.area_group
    }));
    res.json({ groups: transformedGroups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/area-groups', async (req, res) => {
  try {
    const lastGroup = await AreaGroup.findOne().sort({ group_id: -1 });
    const newGroupId = lastGroup ? lastGroup.group_id + 1 : 1;

    const group = new AreaGroup({
      group_id: newGroupId,
      area_group: req.body.area_group
    });

    const newGroup = await group.save();
    res.status(201).json({ group: newGroup });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/area-groups/:id', async (req, res) => {
  try {
    const group = await AreaGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Area group not found' });
    }

    group.area_group = req.body.area_group;
    const updatedGroup = await group.save();
    res.json({ group: updatedGroup });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/area-groups/:id', async (req, res) => {
  try {
    const group = await AreaGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Area group not found' });
    }

    // Check if any areas are using this group
    const areasUsingGroup = await Area.findOne({ group_id: req.params.id });
    if (areasUsingGroup) {
      return res.status(400).json({ message: 'Cannot delete group that is being used by areas' });
    }

    await group.deleteOne();
    res.json({ message: 'Area group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Area Routes
router.post('/areas', async (req, res) => {
  try {
    const lastArea = await Area.findOne().sort({ area_id: -1 });
    const newAreaId = lastArea ? lastArea.area_id + 1 : 1;

    const area = new Area({
      area_id: newAreaId,
      area_name: req.body.area_name,
      group_id: req.body.group_id
    });

    const newArea = await area.save();
    res.status(201).json({ area: newArea });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/areas/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    area.area_name = req.body.area_name;
    area.group_id = req.body.group_id;
    const updatedArea = await area.save();
    res.json({ area: updatedArea });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/areas/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    // Check if any customers are using this area
    const customersUsingArea = await Customer.findOne({ area_id: req.params.id });
    if (customersUsingArea) {
      return res.status(400).json({ message: 'Cannot delete area that is being used by customers' });
    }

    await area.deleteOne();
    res.json({ message: 'Area deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customers by group ID
router.get('/group/:groupId', async (req, res) => {
  try {
    // First find all areas in the group
    const areas = await Area.find({ group_id: req.params.groupId });
    const areaIds = areas.map(area => area._id);

    // Then find all customers in those areas
    const customers = await Customer.find({ area_id: { $in: areaIds } })
      .populate({
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      })
      .sort({ customer_name: 1 });

    // Transform the data to include combined area information
    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      customer_name: customer.customer_name,
      area_id: customer.area_id,
      area_name: customer.area_id ? customer.area_id.area_name : '',
      group_name: customer.area_id?.group_id?.area_group || '',
      balance_bf: customer.balance_bf,
      balance: customer.balance,
      less: customer.less,
      phone: customer.phone
    }));

    res.json({ customers: transformedCustomers });
  } catch (err) {
    console.error('Error fetching customers by group:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get customers by group ID with balance
router.get('/group/:groupId/balance', async (req, res) => {
  try {
    // First find all areas in the group
    const areas = await Area.find({ group_id: req.params.groupId });
    const areaIds = areas.map(area => area._id);

    // Then find all customers in those areas
    const customers = await Customer.find({ area_id: { $in: areaIds } })
      .populate({
        path: 'area_id',
        select: 'area_name group_id',
        populate: {
          path: 'group_id',
          select: 'area_group'
        }
      })
      .sort({ customer_name: 1 });


    // Calculate balances for all customers
    const transformedCustomers = await Promise.all(customers.map(async customer => {
      return {
        _id: customer._id,
        customer_name: customer.customer_name,
        area_id: customer.area_id,
        area_name: customer.area_id ? customer.area_id.area_name : '',
        group_name: customer.area_id?.group_id?.area_group || '',
        balance_bf: customer.balance_bf,
        balance: customer.balance,
        less: customer.less,
        phone: customer.phone
      };
    }));

    res.json({ customers: transformedCustomers });
  } catch (err) {
    console.error('Error fetching customers by group:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update all customer balances
router.post('/update-all-balances', async (req, res) => {
  try {
    console.log('Starting bulk customer balance update...');
    
    // Get all customers
    const customerId = '684fa79a6a09962c26b46864';
    const customer = await Customer.findById(customerId);
    const customers = customer ? [customer] : [];
    console.log(`Found ${customers.length} customers to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Update each customer's balance
    for (const customer of customers) {
      try {
        let balance = customer.balance_bf; // Opening balance

        // Get all sales for this customer
        const sales = await Sales.find({ cust_id: customer._id });
        
        // Calculate total sales amount
        let totalSales = 0;
        sales.forEach(sale => {
          const saleAmount = Math.round(sale.amount - (sale.amount * (sale.special_less || 0) / 100));
          totalSales += saleAmount;
        });

        // Add total sales to balance
        balance += totalSales;

        // Get all cash receipts for this customer
        const received = await CashData.find({ cust_id: customer._id });
        
        // Calculate total received amount
        let totalReceived = 0;
        received.forEach(receipt => {
          totalReceived += receipt.amount;
        });

        // Subtract total received from balance
        balance -= totalReceived;

        // Update customer balance in database
        await Customer.findByIdAndUpdate(customer._id, { balance: balance });
        
        updatedCount++;
        console.log(`Updated balance for customer: ${customer.customer_name} - New balance: ${balance}`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Error updating customer ${customer.customer_name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    console.log(`Bulk update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    res.json({
      success: true,
      message: `Bulk customer balance update completed`,
      summary: {
        totalCustomers: customers.length,
        updatedCount: updatedCount,
        errorCount: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in bulk customer balance update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating all customer balances',
      error: error.message
    });
  }
});

module.exports = router;