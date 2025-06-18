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
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxHeight: '90vh',
          overflow: 'hidden',
          mt: 2,
          mx: 2
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Bulk Cash Entry
        </Typography>
        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                backgroundColor: 'action.hover',
                color: 'text.primary'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          pt: 4,
          pb: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Entry Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: '1.2rem',
                    mb: 0.5
                  }}
                >
                  Select Group
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    InputLabelProps={{ shrink: false }}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group._id} value={group._id}>
                        {group.area_group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: '1.2rem',
                    mb: 0.5
                  }}
                >
                  Date
                </Typography>
                <TextField
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: false }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: '1.2rem',
                    mb: 0.5
                  }}
                >
                  Detail
                </Typography>
                <TextField
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={2}
                  placeholder="Enter payment details or remarks"
                  InputLabelProps={{ shrink: false }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {selectedGroup && (
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              Customer Entries
            </Typography>
            
            <TableContainer 
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'primary.main', color: 'white' }}>
                      Customer Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'primary.main', color: 'white' }}>
                      Area
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'primary.main', color: 'white' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'primary.main', color: 'white' }}>
                      Amount in Words
                    </TableCell>
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
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' },
                        cursor: 'pointer'
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{customer.customer_name}</TableCell>
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
                          placeholder="Enter amount"
                          InputProps={{
                            startAdornment: 'RS ',
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
                      <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                        {cashEntries.find(e => e.customer_id === customer._id)?.amount 
                          ? convertToWords(cashEntries.find(e => e.customer_id === customer._id).amount)
                          : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.contrastText' }}>
                Total Amount: PKR {totalAmount.toLocaleString('en-PK')}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1
        }}
      >
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            minWidth: 80,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!selectedGroup || customers.length === 0}
          sx={{ 
            minWidth: 80,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }
          }}
        >
          Save Entries
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCashEntryDialog; 