import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import { getAreaGroups, getCustomersByGroup } from '../../api';
import { convertToWords } from '../../utils/numberToWords';

const BulkCashEntryDialog = ({ open, onClose, onSave, invNo }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [customers, setCustomers] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const inputRefs = useRef([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await getAreaGroups();
        if (response && response.groups) {
          setGroups(response.groups);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      if (selectedGroup) {
        try {
          const response = await getCustomersByGroup(selectedGroup);
          if (response && response.customers) {
            setCustomers(response.customers);
            // Initialize cash entries for each customer without prefilled zero
            setCashEntries(response.customers.map(customer => ({
              customer_id: customer._id,
              amount: '',  // Empty string instead of 0
              inv_no: invNo,
              date: date,
              detail: detail
            })));
            // Reset selected row when customers change
            setSelectedRowIndex(-1);
          }
        } catch (error) {
          console.error('Error loading customers:', error);
        }
      }
    };
    loadCustomers();
  }, [selectedGroup, invNo, date, detail]);

  const handleAmountChange = (customerId, amount) => {
    setCashEntries(prev => prev.map(entry => 
      entry.customer_id === customerId 
        ? { ...entry, amount: amount === '' ? '' : Number(amount) }
        : entry
    ));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        setSelectedRowIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < customers.length - 1) {
        setSelectedRowIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSave = () => {
    // Filter out entries with empty or zero amount
    const validEntries = cashEntries.filter(entry => entry.amount && entry.amount > 0);
    onSave(validEntries);
  };

  // Calculate total amount (handle empty values)
  const totalAmount = cashEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle> Cash Entry</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Group</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Select Group"
            >
              {groups.map((group) => (
                <MenuItem key={group._id} value={group._id}>
                  {group.area_group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>

        {selectedGroup && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Amount in Words</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow 
                    key={customer._id}
                    selected={selectedRowIndex === index}
                    onClick={() => {
                      setSelectedRowIndex(index);
                      inputRefs.current[index]?.focus();
                    }}
                  >
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>{customer.area_id?.area_name || 'N/A'}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={cashEntries.find(e => e.customer_id === customer._id)?.amount || ''}
                        onChange={(e) => handleAmountChange(customer._id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        size="small"
                        inputRef={el => inputRefs.current[index] = el}
                        onClick={(e) => e.stopPropagation()}
                        inputProps={{
                          style: { 
                            textAlign: 'right',
                            MozAppearance: 'textfield'
                          }
                        }}
                        sx={{
                          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {cashEntries.find(e => e.customer_id === customer._id)?.amount 
                        ? convertToWords(cashEntries.find(e => e.customer_id === customer._id).amount)
                        : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {totalAmount > 0 ? convertToWords(totalAmount) : ''}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!selectedGroup || cashEntries.every(entry => entry.amount === 0)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCashEntryDialog; 