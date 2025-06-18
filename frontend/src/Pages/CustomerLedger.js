import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Snackbar
} from '@mui/material';
import { getCustomers, getCustomerLedger } from '../api';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const CustomerLedger = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ledgerData, setLedgerData] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set current date to both start and end date fields on component mount
  useEffect(() => {
    const currentDate = getCurrentDateForInput();
    setStartDate(currentDate);
    setEndDate(currentDate);
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await getCustomers();
        if (response && response.customers) {
          setCustomers(response.customers);
        }
      } catch (error) {
        setError('Failed to load customers');
      }
    };
    loadCustomers();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await getCustomerLedger(
        selectedCustomer,
        startDate,
        endDate
      );

      if (response.success) {
        setLedgerData(response.ledgerData);
        setCustomerDetails(response.customer);
      } else {
        setError(response.message || 'Failed to generate report');
      }
    } catch (error) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Customer Ledger Report
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Select Customer</InputLabel>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                label="Select Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.customer_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {customerDetails && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">
                <strong>Customer:</strong> {customerDetails.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">
                <strong>Area:</strong> {customerDetails.area}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">
                <strong>Group:</strong> {customerDetails.group}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {ledgerData.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Sales</TableCell>
                <TableCell align="right">Received</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">
                    {row.sales ? formatCurrency(row.sales) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.received ? formatCurrency(row.received) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={Boolean(error)}
        message={error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      />
    </Box>
  );
};

export default CustomerLedger; 