const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales'); // Path to Sales model
const Customer = require('../models/Customer'); // Path to Customer model
const SalesItems = require('../models/SalesItems'); // Path to SalesItems model
const Inventories = require('../models/Inventories'); // Path to Inventories model
const Area = require('../models/Area'); // Path to Inventories model
const AreaGroup = require('../models/AreaGroup'); // Path to Inventories model
const CashData = require('../models/CashData'); // Path to CashData model

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

router.get('/all', async (req, res) => {
    try {
        // Get page and limit from query params (default: page=1, limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the starting index
        const startIndex = (page - 1) * limit;

        // Fetch sales data with pagination and populate customer, area, and area group info
        const salesData = await Sales.find()
            .populate({
                path: 'cust_id',
                select: 'customer_name area_id', // Include customer_name and area_id fields from Customer
                model: Customer,
                populate: {
                    path: 'area_id',
                    select: 'area_name group_id', // Include area_name and group_id fields from Area
                    model: Area,
                    populate: {
                        path: 'group_id',
                        select: 'area_group', // Include area_group field from AreaGroup
                        model: AreaGroup
                    }
                }
            })
            .sort({ sale_id: -1 }) // Sort by most recent sales
            .skip(startIndex)
            .limit(limit);

        // Get total count for pagination metadata
        const totalSales = await Sales.countDocuments();

        // Format sales data with customer name, area name, and group name
        const formattedSalesData = salesData.map(sale => {
            const customer = sale.cust_id;

            if (!customer) {
                console.log('No customer found for sale ID:', sale._id);
                return {
                    ...sale.toObject(),
                    customerNameWithAreaAndGroup: 'Unknown Customer',
                };
            }

            const area = customer.area_id;

            // Check if area_id and group_id exist before accessing them
            const formattedCustomerName = area 
                ? (area.group_id
                    ? `${customer.customer_name} (${area.area_name} - ${area.group_id.area_group})`
                    : `${customer.customer_name} (${area.area_name})`)
                : customer.customer_name;

            return {
                ...sale.toObject(),
                customerNameWithAreaAndGroup: formattedCustomerName,
            };
        });


        // Prepare response with salesData key
        res.status(200).json({
            success: true,
            salesData: formattedSalesData, // Rename 'data' to 'salesData'
            pagination: {
                total: totalSales,
                page,
                limit,
                totalPages: Math.ceil(totalSales / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.post('/save-sale', async (req, res) => {
    const { sale_id,date, cust_id, amount, special_less, remarks, items } = req.body;
    console.log(req.body);

    if (!cust_id) {
        return res.status(400).json({ message: "SELECT THE CUSTOMER FIRST" });
    }

    if (amount === 0) {
        return res.status(400).json({ message: "Empty Bill" });
    }

    try {

        const sale = new Sales({
            sale_id,
            date,
            cust_id,
            amount,
            special_less,
            remarks
        });

        const savedSale = await sale.save(); // Save without session

        for (const item of items) {
            const { item_id, quantity, rate } = item;

            const inventoryItem = await Inventories.findOne({ _id: item_id }); // Use findOne instead of find
            if (!inventoryItem) {
                await sale.deleteOne(savedSale);
                return res.status(400).json({ message: `Item with ID ${item_id} not found in inventory.` });
            }


            // Create the SalesItem
            const salesItem = new SalesItems({
                sales_id: savedSale._id,
                item_id: inventoryItem._id,
                quantity,
                rate,
                cost: inventoryItem.cost
            });

            await salesItem.save();
        }
        
        // Update customer balance after adding sale
        await updateCustomerBalance(cust_id);
        
        res.status(201).json({ message: "Sales data saved successfully." });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while saving sales data: " + error.message });
    }
    
});

router.put('/save-sale', async (req, res) => {
    const { sale_id, date, cust_id, amount, special_less, remarks, items } = req.body;
    console.log(req.body);

    if (!cust_id) {
        return res.status(400).json({ message: "SELECT THE CUSTOMER FIRST" });
    }

    try {
        // Find and update the existing sale using MongoDB _id
        const updatedSale = await Sales.findByIdAndUpdate(
            sale_id, // This should be the MongoDB _id, not the sale_id number
            {
                date,
                cust_id,
                amount,
                special_less,
                remarks
            },
            { new: true }
        );

        if (!updatedSale) {
            return res.status(404).json({ message: "Sale not found" });
        }

        // Get existing sales items using the MongoDB _id
        const existingItems = await SalesItems.find({ sales_id: updatedSale._id });
        const existingItemsMap = new Map(existingItems.map(item => [item.item_id.toString(), item]));

        // Process each item in the request
        for (const item of items) {
            const { item_id, quantity, rate } = item;

            // Fetch the cost from the inventory
            const inventoryItem = await Inventories.findOne({ _id: item_id });
            if (!inventoryItem) {
                return res.status(400).json({ message: `Item with ID ${item_id} not found in inventory.` });
            }

            // Check if this item already exists
            const existingItem = existingItemsMap.get(item_id.toString());
            
            if (existingItem) {
                // Update existing item
                existingItem.quantity = quantity;
                existingItem.rate = rate;
                existingItem.cost = inventoryItem.cost;
                await existingItem.save();
                // Remove from map to track which items were updated
                existingItemsMap.delete(item_id.toString());
            } else {
                // Create new item if it doesn't exist
                const salesItem = new SalesItems({
                    sales_id: updatedSale._id,
                    item_id: inventoryItem._id,
                    quantity,
                    rate,
                    cost: inventoryItem.cost
                });
                await salesItem.save();
            }
        }

        // Delete any remaining items that weren't in the update request
        if (existingItemsMap.size > 0) {
            const itemIdsToDelete = Array.from(existingItemsMap.keys());
            await SalesItems.deleteMany({ 
                sales_id: updatedSale._id, 
                item_id: { $in: itemIdsToDelete }
            });
        }

        // Update customer balance after updating sale
        await updateCustomerBalance(cust_id);

        res.status(200).json({ message: "Sales data updated successfully." });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ message: "An error occurred while updating sales data: " + error.message });
    }
});

router.get('/sale-items/:saleId', async (req, res) => {
    const { saleId } = req.params;

    try {
        const saleItems = await SalesItems.find({ sales_id: saleId })
            .populate({
                path: 'item_id',
                model: Inventories,
                select: 'length gauge net_rate sequence',
            })
            .sort({ 'item_id.sequence': 1 });
        
        if (!saleItems.length) {
            return res.status(404).json({ success: false, message: 'No sale items found for this sale ID.' });
        }

        res.status(200).json({ success: true, saleItems });
    } catch (error) {
        console.error('Error fetching sale items:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching sale items.' });
    }
});

router.get('/id', async (req, res) => {
    const { searchQuery } = req.query;
    console.log('searchQuery:', searchQuery);

    try {
        let sales = [];

        if (searchQuery.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Empty Bar',
            });
        }

        const isNumeric = !isNaN(searchQuery);
        if (!isNumeric && (!searchQuery || searchQuery.trim().length < 3)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter at least 4 characters for search.',
            });
        }

        // If searchQuery is a number, try finding by sale_id
        if (isNumeric) {
            const sale = await Sales.findOne({ sale_id: Number(searchQuery) })
                .populate({
                    path: 'cust_id',
                    select: 'customer_name area_id',
                    model: Customer,
                    populate: {
                        path: 'area_id',
                        select: 'area_name group_id',
                        model: Area,
                        populate: {
                            path: 'group_id',
                            select: 'area_group',
                            model: AreaGroup
                        }
                    }
                });

            if (sale) sales.push(sale);
        }

        // If no sale found by ID, or query is not numeric → search by customer name
        if (sales.length === 0) {
            const customers = await Customer.find({
                customer_name: { $regex: searchQuery, $options: 'i' }
            });

            if (customers.length > 0) {
                const customerIds = customers.map(c => c._id);
                sales = await Sales.find({ cust_id: { $in: customerIds } })
                    .populate({
                        path: 'cust_id',
                        select: 'customer_name area_id',
                        model: Customer,
                        populate: {
                            path: 'area_id',
                            select: 'area_name group_id',
                            model: Area,
                            populate: {
                                path: 'group_id',
                                select: 'area_group',
                                model: AreaGroup
                            }
                        }
                    })
                    .sort({ sale_id: -1 }); // Sort by sale_id in descending order
            }
        }

        if (sales.length > 0) {
            // Sort sales by sale_id in descending order (most recent first)
            sales.sort((a, b) => b.sale_id - a.sale_id);
            
            const formattedSalesData = sales.map(sale => {
                const customer = sale.cust_id;

                if (!customer) {
                    console.log('No customer found for sale ID:', sale._id);
                    return {
                        ...sale.toObject(),
                        customerNameWithAreaAndGroup: 'Unknown Customer',
                    };
                }

                const area = customer.area_id;

                const formattedCustomerName = area
                    ? (area.group_id
                        ? `${customer.customer_name} (${area.area_name} - ${area.group_id.area_group})`
                        : `${customer.customer_name} (${area.area_name})`)
                    : customer.customer_name;

                return {
                    ...sale.toObject(),
                    customerNameWithAreaAndGroup: formattedCustomerName,
                };
            });

            res.status(200).json({
                success: true,
                salesData: formattedSalesData
            });
        } else {
            res.status(404).json({ success: false, message: 'No sales found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/last-sale-id', async (req, res) => {
    try {
        const lastSale = await Sales.findOne()
            .sort({ sale_id: -1 }) // Sort by sale_id in descending order
            .select('sale_id'); // Only select the sale_id field

        const nextSaleId = lastSale ? lastSale.sale_id + 1 : 1;

        res.status(200).json({
            success: true,
            nextSaleId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
