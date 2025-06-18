import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Snackbar,
  Alert,
  DialogContentText,
} from "@mui/material";

import LabelledInput from "./LabelledInput";
import { getCustomers, getInventory, getCustomerDetails, saveSale, editSale, getSaleItems } from "../../api"; // Import the new API function
import ItemsTable from "./ItemsTable"; // Import the ItemsTable component
import SalePrintPreview from "./SalePrintPreview";
import { parseDDMMYYYYToISO } from '../../utils/dateUtils';

export default function AddSaleDialog({ open, onClose, invNo, editingSale }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const [invoiceNo, setInvoiceNo] = useState(0);
  const [date, setDate] = useState(
    new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }).substring(0, 19)
  );
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [area, setArea] = useState("");
  const [specialLess, setSpecialLess] = useState("");
  const [prevBalance, setPrevBalance] = useState(0);
  const [items, setItems] = useState([]);
  const [netAmount, setNetAmount] = useState(0);
  const [lessAmount, setLessAmount] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [remarks, setRemarks] = useState("Carton: ");

  useEffect(() => {
    if (open) {
      if (editingSale) {
        loadSaleData(editingSale);
      }
      else{
        loadData();
      }
    }
  }, [open, editingSale]);

  async function loadData() {
    try {
      const response = await getCustomers();
      setCustomers(response.customers || []);

      const inventory = await getInventory();
      const initialRows = (inventory || []).map((inv) => ({
        itemId: inv._id,
        itemDescription: `${inv.length} ${inv.gauge}`,
        qty: 0,
        rate: inv.net_rate || 0,
        amount: 0,
      }));
      setItems(initialRows);

      if (!editingSale) {
        setInvoiceNo(invNo);
        setSelectedCustomerId("");
        setArea("");
        setSpecialLess("");
        setPrevBalance(0);
        setRemarks("Carton: ");
        setNetAmount(0);
        setLessAmount(0);
        setReceivable(0);
        setTotalAmount(0);
        const now = new Date();
        const karachiTime = new Date(
          now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
        );
        
        const year = karachiTime.getFullYear();
        const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
        const day = String(karachiTime.getDate()).padStart(2, '0');
        const hours = String(karachiTime.getHours()).padStart(2, '0');
        const minutes = String(karachiTime.getMinutes()).padStart(2, '0');
        
        const datetimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        setDate(datetimeString);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    }
  }

  async function loadSaleData(sale) {
    try {
      console.log(sale);
      const response = await getCustomers();
      setCustomers(response.customers || []);
      setInvoiceNo(sale.sale_id);
      
      // Parse the date from DD/MM/YYYY HH:MM format to ISO format
      const isoDate = parseDDMMYYYYToISO(sale.date);
      setDate(isoDate);
      
      setSelectedCustomerId(sale.cust_id._id);
      setSpecialLess(sale.special_less?.toString() || "");
      setRemarks(sale.remarks || "Carton: ");

      // Load items
      const saleItems = await getSaleItems(sale._id);
      const initialRows = (saleItems.data.saleItems || [])
        .sort((a, b) => {
          // Sort by sequence as strings
          return a.item_id.sequence.localeCompare(b.item_id.sequence, undefined, { numeric: true });
        })
        .map((inv) => ({
          saleitem_id: inv._id,
          cost: inv.cost,
          itemId: inv.item_id._id,
          itemDescription: `${inv.item_id.length} ${inv.item_id.gauge}`,
          qty: inv.quantity,
          rate: inv.rate,
          amount: inv.quantity * inv.rate,
        }));
      setItems(initialRows);
    
      // Convert the date to proper format for backend API call
      const convertedDate = convertDateForBackend(isoDate);
      await fetchCustomerDetails(sale.cust_id._id, convertedDate, sale._id);

    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    }
  }

  useEffect(() => {
    recalcTotals();
  }, [items, specialLess, prevBalance]);

  useEffect(() => {
    if (selectedCustomerId) {
      if (editingSale){
        fetchCustomerDetails(selectedCustomerId, date, editingSale._id);
      }
      else{
        fetchCustomerDetails(selectedCustomerId, date);
      }
    }
  }, [selectedCustomerId, date]);

  async function fetchCustomerDetails(customerId, selectedDate, invoiceId) {
    try {
      const customerDetails = await getCustomerDetails(customerId, selectedDate, invoiceId);
      setArea(customerDetails.area);
      setSpecialLess(customerDetails.less);
      setPrevBalance(customerDetails.balance);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    }
  }

  function recalcTotals() {
    let sum = 0;
    items.forEach((it) => {
      sum += it.amount || 0;
    });
    const net = sum;

    let less = 0;
    let receiv = net;
    const special = parseFloat(specialLess) || 0;
    if (special > 0 && special <= 100) {
      less = Math.round((net * special) / 100.0);
      receiv = Math.round(net - less);
    }
    const total = Math.round((prevBalance || 0) + receiv);

    setNetAmount(net);
    setLessAmount(less);
    setReceivable(receiv);
    setTotalAmount(total);
  }

  const handleItemChange = (rowIndex, field, newValue) => {
    setItems((old) => {
      const clone = [...old];
      const item = { ...clone[rowIndex] };
      if (field === "qty") {
        item.qty = parseFloat(newValue) || 0;
      } else if (field === "rate") {
        item.rate = parseFloat(newValue) || 0;
      }
      item.amount = item.qty * item.rate;
      clone[rowIndex] = item;
      return clone;
    });
  };

  const handleCustomerChange = (value) => {
    setSelectedCustomerId(value);
    setArea("");
    setSpecialLess("");
    setPrevBalance(0);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  // Convert datetime-local format to proper Date object for backend
  const convertDateForBackend = (dateString) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  const handlePrintClick = async () => {
    // Close dialog immediately
    onClose();
    
    // Prepare sale data
    const saleData = editingSale ? {
      sale_id: editingSale._id,
      date: convertDateForBackend(date),
      cust_id: selectedCustomerId,
      amount: netAmount,
      special_less: parseFloat(specialLess) || 0,
      remarks,
      items: items.map(item => ({
        saleitem_id: item.saleitem_id,
        item_id: item.itemId,
        quantity: item.qty,
        rate: item.rate,
        cost: item.cost,
      })),
    } : {
      sale_id: invoiceNo,
      date: convertDateForBackend(date),
      cust_id: selectedCustomerId,
      amount: netAmount,
      special_less: parseFloat(specialLess) || 0,
      remarks,
      items: items.map(item => ({
        item_id: item.itemId,
        quantity: item.qty,
        rate: item.rate,
      })),
    };

    // Handle backend operation asynchronously
    try {
      if (editingSale) {
        await editSale(saleData);
      } else {
        await saveSale(saleData);
      }
      // Show print preview on success
      setShowPrintPreview(true);
      setSnackbar({ open: true, message: 'Sale saved successfully', severity: 'success' });
    } catch (error) {
      // Show error if backend operation fails
      setSnackbar({ open: true, message: error.message || 'Error saving sale', severity: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getSelectedCustomerName = () => {
    const customer = customers.find(c => c._id === selectedCustomerId);
    return customer ? customer.customer_name : '';
  };

  const printData = {
    invoiceNo,
    date,
    customer: getSelectedCustomerName(),
    area,
    items,
    netAmount,
    specialLess,
    lessAmount,
    receivable,
    prevBalance,
    totalAmount,
    remarks
  };

  const handleSaveClick = async () => {
    // Close dialog immediately
    onClose();
    
    // Prepare sale data
    const saleData = editingSale ? {
      sale_id: editingSale._id,
      date: convertDateForBackend(date),
      cust_id: selectedCustomerId,
      amount: netAmount,
      special_less: parseFloat(specialLess) || 0,
      remarks,
      items: items.map(item => ({
        saleitem_id: item.saleitem_id,
        item_id: item.itemId,
        quantity: item.qty,
        rate: item.rate,
        cost: item.cost,
      })),
    } : {
      sale_id: invoiceNo,
      date: convertDateForBackend(date),
      cust_id: selectedCustomerId,
      amount: netAmount,
      special_less: parseFloat(specialLess) || 0,
      remarks,
      items: items.map(item => ({
        item_id: item.itemId,
        quantity: item.qty,
        rate: item.rate,
      })),
    };

    // Handle backend operation asynchronously
    try {
      if (editingSale) {
        await editSale(saleData);
      } else {
        await saveSale(saleData);
      }
      // Success - could show a success message if needed
      setSnackbar({ open: true, message: 'Sale saved successfully', severity: 'success' });
    } catch (error) {
      // Show error if backend operation fails
      setSnackbar({ open: true, message: error.message || 'Error saving sale', severity: 'error' });
    }
  };

  const handleCloseClick = () => {
    const hasData = selectedCustomerId || items.some(item => item.qty > 0) || specialLess || remarks !== "Carton: ";
    
    if (hasData) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={handleCloseClick} fullWidth maxWidth="lg">
        <DialogTitle>{editingSale ? 'Edit Sale' : 'Add New Sale'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
            <Box>
                <InputLabel shrink>Inv. No.</InputLabel>
                <TextField
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  readOnly
                />
              </Box>

            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <InputLabel shrink>Date</InputLabel>
                <TextField
                  type="datetime-local" // Allow date and time selection
                  value={date}
                  onChange={handleDateChange}
                  fullWidth
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <InputLabel shrink>Customer</InputLabel>
                <Select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  displayEmpty
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {customers.map((cust) => (
                    <MenuItem key={cust._id} value={cust._id}>
                      {cust.customer_name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <Box>
                <InputLabel shrink>Area</InputLabel>
                <TextField
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  readOnly
                  size="small"
                />
              </Box>

            </Grid>

          </Grid>
          <Grid container spacing={2}>
            {/* Left Column for Items Table */}
            <Grid item xs={12} md={8}>
              <ItemsTable items={items} onChangeItem={handleItemChange} />
            </Grid>

            {/* Right Column for Other Fields */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <LabelledInput label="Net Amount" value={netAmount.toFixed(2)} readOnly />
                    <LabelledInput
                      label="Special Less"
                      value={specialLess}
                      onChange={(e) => setSpecialLess(e.target.value)}
                    />
                    <LabelledInput label="Less Amount" value={lessAmount.toFixed(2)} readOnly />
                    <LabelledInput label="Receivable" value={receivable.toFixed(2)} readOnly />
                    <LabelledInput
                      label="Prev Balance"
                      value={prevBalance.toFixed(2)}
                      readOnly
                    />
                    <LabelledInput label="Total Amount" value={totalAmount.toFixed(2)} readOnly />
                  </Box>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                  <InputLabel shrink>Remarks</InputLabel>
                  <TextField
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>

            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handlePrintClick} variant="contained" color="primary">
            Print
          </Button>
          <Button onClick={handleSaveClick} variant="contained" color="primary">
            Save
          </Button>
          <Button onClick={handleCloseClick} variant="outlined" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Close</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Are you sure you want to close without saving?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmClose} color="error" variant="contained">
            Close Without Saving
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <SalePrintPreview
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        saleData={printData}
        onPrint={handlePrint}
      />

      {/* Error Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert elevation={6} variant="filled" onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}