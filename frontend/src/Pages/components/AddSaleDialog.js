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
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";

import LabelledInput from "./LabelledInput";
import { getCustomerDetails, saveSale, editSale, getSaleItems } from "../../api"; // Import the new API function
import SalePrintPreview from "./SalePrintPreview";
import { parseDDMMYYYYToISO } from '../../utils/dateUtils';

// ItemsTable component moved into the same file
function ItemsTable({ items, onChangeItem, onTabFromTable }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // State for tracking the currently selected cell
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const inputRefs = React.useRef([]); // Refs for input fields

  // Focus the selected cell whenever it changes
  useEffect(() => {
    const input = inputRefs.current[selectedCell.row]?.[selectedCell.col];
    if (input) {
      input.focus();
      // Move cursor to the end of the value
      const value = input.value;
      if (typeof value === 'string') {
        // Set selection range to the end
        input.setSelectionRange(value.length, value.length);
      }
    }
  }, [selectedCell]);

  // Handle keyboard navigation
  const handleKeyDown = (e, rowIndex, colIndex) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: Math.max(0, prev.row - 1),
          col: prev.col,
        }));
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: Math.min(items.length - 1, prev.row + 1),
          col: prev.col,
        }));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: prev.row,
          col: Math.max(0, prev.col - 1),
        }));
        break;
      case "ArrowRight":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: prev.row,
          col: Math.min(1, prev.col + 1), // Only 2 columns (qty and rate)
        }));
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        
          if (onTabFromTable) {
            onTabFromTable();
          }
        
        break;
      default:
        break;
    }
  };

  return (
    <Box
      sx={{
        maxHeight: 400,
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
      }}
    >
      {/* Header Row */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={5}>
          <Typography variant="subtitle2" fontWeight="bold">
            Item Description
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" fontWeight="bold" align="center">
            Qty
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" fontWeight="bold" align="center">
            Rate
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="subtitle2" fontWeight="bold" align="right">
            Amount
          </Typography>
        </Grid>
      </Grid>

      {items.map((row, rowIndex) => (
      <Grid
        container
        spacing={0.5} // Reduced spacing
        key={rowIndex}
        sx={{
          mb: 0.5, // Reduced vertical gap between rows
          backgroundColor:
            selectedCell.row === rowIndex ? "action.hover" : "background.paper",
          borderRadius: 1,
          p: 0.5, // Reduced overall padding
        }}
      >
        {/* Item Description */}
        <Grid item xs={5}>
          <Box
            sx={{
              p: 0.5, // Reduced padding
              backgroundColor: "background.default",
              borderRadius: 1,
            }}
          >
            <Typography variant="body1" sx={{ fontSize: '1.15rem', fontWeight: 500 }}>
              {row.itemDescription}
            </Typography>
          </Box>
        </Grid>

        {/* Quantity */}
        <Grid item xs={2} sx={{ minWidth: isSmallScreen ? '60px' : 'auto' }}>
          <TextField
            type="text"
            value={row.qty || ""}
            onChange={(e) => onChangeItem(rowIndex, "qty", e.target.value)}
            size="small"
            fullWidth
            data-item-row={rowIndex}
            data-field="qty"
            inputRef={(el) => {
              if (!inputRefs.current[rowIndex]) {
                inputRefs.current[rowIndex] = [];
              }
              inputRefs.current[rowIndex][0] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
            onFocus={() => setSelectedCell({ row: rowIndex, col: 0 })}
            inputProps={{
              style: { textAlign: "center", fontSize: '1.15rem', fontWeight: 500 },
              inputMode: 'numeric',
              pattern: '[0-9]*',
              "aria-label": `Quantity for ${row.itemDescription}`,
            }}
            autoComplete="off"
            sx={{
              backgroundColor:
                selectedCell.row === rowIndex && selectedCell.col === 0
                  ? "action.selected"
                  : "background.paper",
            }}
          />
        </Grid>

        {/* Rate */}
        <Grid item xs={2} sx={{ minWidth: isSmallScreen ? '60px' : 'auto' }}>
          <TextField
            type="text"
            value={row.rate || ""}
            onChange={(e) => onChangeItem(rowIndex, "rate", e.target.value)}
            size="small"
            fullWidth
            data-item-row={rowIndex}
            data-field="rate"
            inputRef={(el) => {
              if (!inputRefs.current[rowIndex]) {
                inputRefs.current[rowIndex] = [];
              }
              inputRefs.current[rowIndex][1] = el;
            }}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
            onFocus={() => setSelectedCell({ row: rowIndex, col: 1 })}
            inputProps={{
              style: { textAlign: "center", fontSize: '1.15rem', fontWeight: 500 },
              inputMode: 'decimal',
              pattern: '[0-9.]*',
              "aria-label": `Rate for ${row.itemDescription}`,
            }}
            autoComplete="off"
            sx={{
              backgroundColor:
                selectedCell.row === rowIndex && selectedCell.col === 1
                  ? "action.selected"
                  : "background.paper",
            }}
          />
        </Grid>

        {/* Amount */}
        <Grid item xs={3}>
          <Box
            sx={{
              p: 0.5, // Reduced padding
              backgroundColor: "background.default",
              borderRadius: 1,
              textAlign: "right",
            }}
          >
            <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>
              {row.amount?.toFixed(2) || "0.00"}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    ))}
    </Box>
  );
}

export default function AddSaleDialog({ open, onClose, invNo, editingSale, customers, inventory }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const [invoiceNo, setInvoiceNo] = useState(0);
  const [date, setDate] = useState(
    new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }).substring(0, 19)
  );
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

  // Focus management refs
  const dateInputRef = React.useRef(null);
  const customerSelectRef = React.useRef(null);
  const remarksInputRef = React.useRef(null);
  const printButtonRef = React.useRef(null);

  useEffect(() => {
    if (open) {
      if (editingSale) {
        loadSaleData(editingSale);
      }
      else{
        loadData();
      }
      // Focus on date field when dialog opens
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
        }
      }, 100);
    }
  }, [open, editingSale, inventory]);

  async function loadData() {
    try {
      // Use passed customers and inventory props instead of API calls
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
      // Use passed customers prop instead of API call
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
      await fetchCustomerDetails(sale.cust_id._id, convertedDate, sale._id, true);

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

  async function fetchCustomerDetails(customerId, selectedDate, invoiceId, skipSpecialLessUpdate = false) {
    try {
      const customerDetails = await getCustomerDetails(customerId, selectedDate, invoiceId);
      setArea(customerDetails.area);
      if (!skipSpecialLessUpdate) setSpecialLess(customerDetails.less);
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
      receiv = Math.round(net - (net * (special || 0) / 100));
      
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

  const handleCustomerKeyDown = (e) => {
    handleKeyDown(e, 'customer');
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleDateKeyDown = (e) => {
    handleKeyDown(e, 'date');
  };

  const handleRemarksKeyDown = (e) => {
    handleKeyDown(e, 'remarks');
  };

  const handleTabFromTable = () => {
    if (remarksInputRef.current) {
      remarksInputRef.current.focus();
      // Move cursor to the end of the text
      const textLength = remarks.length;
      remarksInputRef.current.setSelectionRange(textLength, textLength);
    }
  };

  // Convert datetime-local format to proper Date object for backend
  const convertDateForBackend = (dateString) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  const handlePrintClick = async () => {
    // Show print preview immediately
    setShowPrintPreview(true);
    
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

    // Handle backend operation asynchronously in the background
    try {
      if (editingSale) {
        await editSale(saleData);
      } else {
        await saveSale(saleData);
      }
      // Close the main dialog after successful save to refresh the sales list
      onClose();
      // Show success message if needed
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

  // Handle keyboard navigation
  const handleKeyDown = (event, currentField) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      
      switch (currentField) {
        case 'date':
          if (customerSelectRef.current) {
            customerSelectRef.current.focus();
          }
          break;
        case 'customer':
          // Focus on first item in the table
          const firstItemInput = document.querySelector('[data-item-row="0"] [data-field="qty"]');
          if (firstItemInput) {
            firstItemInput.focus();
          }
          break;
        case 'remarks':
          if (printButtonRef.current) {
            printButtonRef.current.focus();
          }
          break;
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleCloseClick} fullWidth maxWidth="lg">
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={2}>
            <Box>
                <InputLabel shrink>Inv. No.</InputLabel>
                <TextField
                  value={invoiceNo}
                  readOnly
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: '40px' } }}
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
                  onKeyDown={handleDateKeyDown}
                  fullWidth
                  size="small"
                  inputRef={dateInputRef}
                  sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box>
                <InputLabel shrink>Customer</InputLabel>
                <Select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  onKeyDown={handleCustomerKeyDown}
                  displayEmpty
                  fullWidth
                  size="small"
                  inputRef={customerSelectRef}
                  sx={{ '& .MuiInputBase-root': { height: '40px' } }}
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
                  readOnly
                  size="small"
                  fullWidth
                  sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                />
              </Box>

            </Grid>

          </Grid>
          <Grid container spacing={2}>
            {/* Left Column for Items Table */}
            <Grid item xs={12} md={8}>
              <ItemsTable items={items} onChangeItem={handleItemChange} onTabFromTable={handleTabFromTable} />
            </Grid>

            {/* Right Column for Other Fields */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                    onKeyDown={handleRemarksKeyDown}
                    multiline
                    rows={2}
                    fullWidth
                    inputRef={remarksInputRef}
                  />
                </Grid>

            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handlePrintClick} variant="contained" color="primary" ref={printButtonRef}>
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