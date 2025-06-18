import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Pagination } from '@mui/material';
import { Add as AddIcon, AddCircle as AddCircleIcon } from '@mui/icons-material';
import { addCashData, editCashData, deleteCashData, fetchAllCashData, getCustomers, getNextCashInvoiceNo, searchCashData, addBulkCashData } from '../api';
import GenericTable from './components/GenericTable';
import GenericDialog from './components/GenericDialog';
import BulkCashEntryDialog from './components/BulkCashEntryDialog';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';
import CardView from './components/CardView';
import { formatDateTime } from '../utils/dateUtils';

const CashManagement = () => {
  const [cashList, setCashList] = useState([]);
  const [filteredCashList, setFilteredCashList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: '', direction: '' });
  const [customers, setCustomers] = useState([]);
  const [newCashData, setNewCashData] = useState({ 
    inv_no: '', 
    date: (() => {
      const now = new Date();
      const karachiTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
      );
      
      const year = karachiTime.getFullYear();
      const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
      const day = String(karachiTime.getDate()).padStart(2, '0');
      const hours = String(karachiTime.getHours()).padStart(2, '0');
      const minutes = String(karachiTime.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(),
    cust_id: '', 
    amount: 0, 
    detail: '' 
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCashData, setEditingCashData] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [cashDataToDelete, setCashDataToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [invNo, setInvoiceNo] = useState(0);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);

  const formatCustomerName = (customer) => {
    if (!customer) return '';
    const area = customer.area_id;
    if (!area) return customer.customer_name;
    
    return area.group_id
      ? `${customer.customer_name} (${area.area_name} - ${area.group_id.area_group})`
      : `${customer.customer_name} (${area.area_name})`;
  };

  const refreshCashList = async () => {
    try {
      const [cashResponse, nextId] = await Promise.all([
        fetchAllCashData(pagination.page, pagination.limit),
        getNextCashInvoiceNo()
      ]);

      if (cashResponse && cashResponse.data && cashResponse.data.cashData) {
        const formattedCashData = cashResponse.data.cashData.map(cash => ({
          ...cash,
          date: formatDateTime(cash.date),
          customerNameWithAreaAndGroup: formatCustomerName(cash.cust_id)
        }));
        setCashList(formattedCashData);
        setFilteredCashList(formattedCashData);
        setPagination({
          ...pagination,
          totalPages: Math.ceil(cashResponse.data.pagination.total / pagination.limit),
        });
        setInvoiceNo(nextId);
      }
    } catch (error) {
      setError(error.message || 'Failed to refresh cash data');
    }
  };

  useEffect(() => {
    refreshCashList();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customersResponse = await getCustomers();
        if (customersResponse && customersResponse.customers) {
          setCustomers(customersResponse.customers);
          console.log(customersResponse.customers);
        }
      } catch (error) {
        setError(error.message || 'Failed to fetch customers');
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    let updatedList = [...filteredCashList];

    if (sortConfig.field) {
      updatedList.sort((a, b) => {
        const aField = a[sortConfig.field];
        const bField = b[sortConfig.field];
        if (sortConfig.direction === 'asc') {
          return aField > bField ? 1 : -1;
        } else {
          return aField < bField ? 1 : -1;
        }
      });
    }

    setFilteredCashList(updatedList);
  }, [sortConfig]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredCashList(cashList);
      return;
    }

    try {
      const response = await searchCashData(searchQuery);
      if (response && response.cashData) {
        const formattedCashData = response.cashData.map(cash => ({
          ...cash,
          date: formatDateTime(cash.date),
        }));
        setFilteredCashList(formattedCashData);
      } else {
        setFilteredCashList([]);
        setError('No cash entries found');
      }
    } catch (error) {
      setFilteredCashList([]);
      setError(error.message || 'Failed to fetch cash data. Please try again.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      setFilteredCashList(cashList);
      setError('');
    }
  };

  const handlePaginationChange = (event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleOpenDialog = (cashData = null) => {
    if (cashData) {
      // Safely convert the date to ISO format for datetime-local input
      let dateValue;
      try {
        const date = new Date(cashData.date);
        if (isNaN(date.getTime())) {
          // If date is invalid, use current date
          const now = new Date();
          const karachiTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
          );
          
          const year = karachiTime.getFullYear();
          const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
          const day = String(karachiTime.getDate()).padStart(2, '0');
          const hours = String(karachiTime.getHours()).padStart(2, '0');
          const minutes = String(karachiTime.getMinutes()).padStart(2, '0');
          
          dateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
          dateValue = date.toISOString().slice(0, 16);
        }
      } catch (error) {
        console.error('Date conversion error:', error);
        const now = new Date();
        const karachiTime = new Date(
          now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
        );
        
        const year = karachiTime.getFullYear();
        const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
        const day = String(karachiTime.getDate()).padStart(2, '0');
        const hours = String(karachiTime.getHours()).padStart(2, '0');
        const minutes = String(karachiTime.getMinutes()).padStart(2, '0');
        
        dateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setNewCashData({
        inv_no: cashData.inv_no,
        date: dateValue,
        cust_id: cashData.cust_id._id,
        customer_name: formatCustomerName(cashData.cust_id),
        amount: cashData.amount,
        detail: cashData.detail
      });
    } else {
      // For new cash entry, use current Karachi time
      const now = new Date();
      const karachiTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
      );
      
      const year = karachiTime.getFullYear();
      const month = String(karachiTime.getMonth() + 1).padStart(2, '0');
      const day = String(karachiTime.getDate()).padStart(2, '0');
      const hours = String(karachiTime.getHours()).padStart(2, '0');
      const minutes = String(karachiTime.getMinutes()).padStart(2, '0');
      
      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      setNewCashData({ 
        inv_no: invNo, 
        date: currentDateTime,
        cust_id: '', 
        customer_name: '',
        amount: 0, 
        detail: '' 
      });
    }
    setEditingCashData(cashData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCashData(null);
    refreshCashList();
  };

  const handleSaveCashData = async (cashData) => {
    try {
      // Find the selected customer from the customers list
      const selectedCustomer = customers.find(customer => 
        formatCustomerName(customer) === cashData.customer_name
      );
      
      if (!selectedCustomer) {
        throw new Error('Please select a valid customer');
      }

      // Safely convert the date to ISO format
      let dateValue;
      try {
        const date = new Date(cashData.date);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        dateValue = date.toISOString();
      } catch (error) {
        console.error('Date conversion error:', error);
        throw new Error('Invalid date format. Please select a valid date and time.');
      }

      const cashDataToSave = {
        ...cashData,
        cust_id: selectedCustomer._id,
        date: dateValue
      };

      if (editingCashData) {
        const updatedCashData = await editCashData(editingCashData._id, cashDataToSave);
        setCashList((prev) => prev.map((cash) => 
          cash._id === editingCashData._id ? {
            ...updatedCashData.data.cashData,
            customerNameWithAreaAndGroup: formatCustomerName(updatedCashData.data.cashData.cust_id)
          } : cash
        ));
      } else {
        const addedCashData = await addCashData(cashDataToSave);
        setCashList((prev) => [...prev, {
          ...addedCashData.data.cashData,
          customerNameWithAreaAndGroup: formatCustomerName(addedCashData.data.cashData.cust_id)
        }]);
      }
      handleCloseDialog();
    } catch (error) {
      setError(error.message || 'Failed to save cash data. Please try again.');
    }
  };

  const handleDeleteClick = (cashData) => {
    setCashDataToDelete(cashData);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCashData(cashDataToDelete._id);
      setCashList((prev) => prev.filter((cash) => cash._id !== cashDataToDelete._id));
      setFilteredCashList((prev) => prev.filter((cash) => cash._id !== cashDataToDelete._id));
      setDeleteConfirmDialog(false);
      setCashDataToDelete(null);
    } catch (error) {
      setError(error.message || 'Failed to delete cash data. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmDialog(false);
    setCashDataToDelete(null);
  };

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleOpenBulkDialog = () => {
    setOpenBulkDialog(true);
  };

  const handleCloseBulkDialog = () => {
    setOpenBulkDialog(false);
  };

  const handleBulkSave = async (cashEntries) => {
    try {
      await addBulkCashData(cashEntries);
      handleCloseBulkDialog();
      refreshCashList();
    } catch (error) {
      setError(error.message || 'Failed to save bulk cash data');
    }
  };

  const cashColumns = [
    { label: 'Invoice No', accessor: 'inv_no' },
    { label: 'Date', accessor: 'date' },
    { label: 'Customer Name', accessor: 'customerNameWithAreaAndGroup' },
    { label: 'Amount', accessor: 'amount' },
    { label: 'Detail', accessor: 'detail' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Cash Management</Typography>
      </Box>
      <SearchBar 
        value={searchQuery} 
        onChange={handleSearchChange}
        onSearch={handleSearch}
        placeholder="Search by Invoice Number or Customer Name"
        showSearchButton={true}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <SortControl 
          value={sortConfig.field} 
          onChange={handleSortChange} 
          fields={['inv_no', 'date', 'customerNameWithAreaAndGroup', 'amount', 'detail']} 
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', width: '100%' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={handleOpenBulkDialog}
          >
            Add Cash By Area
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Cash Entry
          </Button>
        </Box>
      </Box>

      {/* Table View */}
      <GenericTable
        data={filteredCashList}
        columns={cashColumns}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteClick}
        onSort={handleSortChange}
        sortConfig={sortConfig}
      />

      {/* Card View */}
      <CardView
        data={filteredCashList}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteClick}
        fields={[
          { name: 'inv_no', label: 'Invoice No' },
          { name: 'date', label: 'Date' },
          { name: 'customerNameWithAreaAndGroup', label: 'Customer Name' },
          { name: 'amount', label: 'Amount' },
          { name: 'detail', label: 'Detail' },
        ]}
      />

      {/* Add/Edit Cash Data Dialog */}
      <GenericDialog
        open={openDialog}
        onClose={handleCloseDialog}
        data={newCashData}
        onSave={handleSaveCashData}
        fields={[
          { 
            name: 'inv_no', 
            label: 'Invoice No', 
            type: 'number', 
            readOnly: true,
            size: 'small'
          },
          { 
            name: 'date', 
            label: 'Date & Time', 
            type: 'datetime-local',
            size: 'medium'
          },
          { 
            name: 'customer_name', 
            label: 'Customer Name',
            type: 'select',
            size: 'medium',
            options: customers.map(customer => ({
              value: formatCustomerName(customer),
              label: formatCustomerName(customer)
            }))
          },
          { 
            name: 'amount', 
            label: 'Amount', 
            type: 'number',
            size: 'small',
            startAdornment: 'RS '
          },
          { 
            name: 'detail', 
            label: 'Detail',
            multiline: true,
            rows: 3,
            helperText: 'Enter payment details or remarks'
          },
        ]}
        title={editingCashData ? 'Edit Cash Entry' : 'Add Cash Entry'}
        maxWidth="md"
      />

      {/* Delete Confirmation Dialog */}
      <GenericDialog
        open={deleteConfirmDialog}
        onClose={handleDeleteCancel}
        title="Confirm Delete"
        data={{ confirmation: '' }}
        fields={[
          {
            name: 'confirmation',
            label: `Are you sure you want to delete cash entry for invoice "${cashDataToDelete?.inv_no}"?`,
            type: 'text',
            readOnly: true,
            multiline: true,
            rows: 2,
            helperText: 'This action cannot be undone'
          }
        ]}
        onSave={handleDeleteConfirm}
        saveButtonText="Delete"
        saveButtonColor="error"
        maxWidth="sm"
      />

      {/* Bulk Cash Entry Dialog */}
      <BulkCashEntryDialog
        open={openBulkDialog}
        onClose={handleCloseBulkDialog}
        onSave={handleBulkSave}
        invNo={invNo}
      />

      <Snackbar open={Boolean(error)} message={error} autoHideDuration={6000} onClose={() => setError('')} />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={pagination.totalPages}
          page={pagination.page}
          onChange={handlePaginationChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default CashManagement; 