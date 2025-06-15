import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { addCustomer, editCustomer, deleteCustomer, fetchAllCustomers, getAreas } from '../api';
import GenericTable from './components/GenericTable';
import GenericDialog from './components/GenericDialog';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';
import CardView from './components/CardView';

const CustomerManagement = () => {
  const [customerList, setCustomerList] = useState([]);
  const [filteredCustomerList, setFilteredCustomerList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: '', direction: '' });
  const [areas, setAreas] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ 
    customer_name: '', 
    area_id: '', 
    balance_bf: 0, 
    balance: 0, 
    less: 0, 
    phone: '' 
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers
        const response = await fetchAllCustomers();
        if (response && response.data && response.data.customers) {
          setCustomerList(response.data.customers);
          setFilteredCustomerList(response.data.customers);
        } else {
          throw new Error('Unexpected response format');
        }

        // Load areas
        const areasResponse = await getAreas();
        if (areasResponse && areasResponse.areas) {
          setAreas(areasResponse.areas);
        }
      } catch (error) {
        setError(error.message || 'Failed to fetch data. Please try again.');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let updatedList = customerList.filter((customer) =>
      Object.values(customer).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig.field) {
      updatedList = updatedList.sort((a, b) => {
        const aField = a[sortConfig.field];
        const bField = b[sortConfig.field];
        if (sortConfig.direction === 'asc') {
          return aField > bField ? 1 : -1;
        } else {
          return aField < bField ? 1 : -1;
        }
      });
    }

    setFilteredCustomerList(updatedList);
  }, [customerList, searchQuery, sortConfig]);

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      // When editing, find the area from the areas list
      const area = areas.find(a => a._id === customer.area_id._id);
      setNewCustomer({
        customer_name: customer.customer_name,
        area_id: customer.area_id._id,
        area_name: area ? area.area_name : '',
        balance_bf: customer.balance_bf,
        balance: customer.balance,
        less: customer.less,
        phone: customer.phone
      });
    } else {
      setNewCustomer({ 
        customer_name: '', 
        area_id: '', 
        area_name: '',
        balance_bf: 0, 
        balance: 0, 
        less: 0, 
        phone: '' 
      });
    }
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      // Find the selected area from the areas list
      const selectedArea = areas.find(area => area.area_name === customerData.area_name);
      
      if (!selectedArea) {
        throw new Error('Please select a valid area');
      }

      const customerToSave = {
        ...customerData,
        area_id: selectedArea._id
      };

      if (editingCustomer) {
        const updatedCustomer = await editCustomer(editingCustomer._id, customerToSave);
        // Transform the updated customer data to include the area name
        const transformedCustomer = {
          ...updatedCustomer.data.customer,
          area_name: `${selectedArea.area_name} (${selectedArea.group_name})`
        };
        setCustomerList((prev) => prev.map((customer) => 
          customer._id === editingCustomer._id ? transformedCustomer : customer
        ));
      } else {
        const addedCustomer = await addCustomer(customerToSave);
        // Transform the new customer data to include the area name
        const transformedCustomer = {
          ...addedCustomer.data.customer,
          area_name: `${selectedArea.area_name} (${selectedArea.group_name})`
        };
        setCustomerList((prev) => [...prev, transformedCustomer]);
      }
      handleCloseDialog();
    } catch (error) {
      setError(error.message || 'Failed to save customer data. Please try again.');
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCustomer(customerToDelete._id);
      setCustomerList((prev) => prev.filter((customer) => customer._id !== customerToDelete._id));
      setDeleteConfirmDialog(false);
      setCustomerToDelete(null);
    } catch (error) {
      setError(error.message || 'Failed to delete customer. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmDialog(false);
    setCustomerToDelete(null);
  };

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const customerColumns = [
    { label: 'Customer Name', accessor: 'customer_name' },
    { label: 'Area Name', accessor: 'area_name' },
    { label: 'Balance BF', accessor: 'balance_bf' },
    { label: 'Balance', accessor: 'balance' },
    { label: 'Less', accessor: 'less' },
    { label: 'Phone', accessor: 'phone' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Customer Management</Typography>
      </Box>
      <SearchBar 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, area, or phone"
          sx={{ width: '80%' }}
        />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Customer
        </Button>
      </Box>

      <SortControl 
        value={sortConfig.field} 
        onChange={handleSortChange} 
        fields={['customer_name', 'area_name', 'balance_bf', 'balance', 'less', 'phone']} 
      />

      {/* Table View */}
      <GenericTable
        data={filteredCustomerList}
        columns={customerColumns}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteClick}
        onSort={handleSortChange}
        sortConfig={sortConfig}
      />

      {/* Card View */}
      <CardView
        data={filteredCustomerList}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteClick}
        fields={[
          { name: 'customer_name', label: 'Customer Name' },
          { name: 'area_name', label: 'Area Name' },
          { name: 'balance_bf', label: 'Balance BF' },
          { name: 'balance', label: 'Balance' },
          { name: 'less', label: 'Less' },
          { name: 'phone', label: 'Phone' },
        ]}
      />

      {/* Add/Edit Customer Dialog */}
      <GenericDialog
        open={openDialog}
        onClose={handleCloseDialog}
        data={newCustomer}
        onSave={handleSaveCustomer}
        fields={[
          { name: 'customer_name', label: 'Customer Name' },
          { 
            name: 'area_name', 
            label: 'Area Name',
            type: 'select',
            options: areas.map(area => ({
              value: area.area_name,
              label: `${area.area_name} (${area.group_name})`
            }))
          },
          { name: 'balance_bf', label: 'Balance BF', type: 'number' },
          { name: 'less', label: 'Less', type: 'number' },
          { name: 'phone', label: 'Phone' },
        ]}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
            label: `Are you sure you want to delete customer "${customerToDelete?.customer_name}"?`,
            type: 'text',
            readOnly: true
          }
        ]}
        onSave={handleDeleteConfirm}
        saveButtonText="Delete"
        saveButtonColor="error"
      />

      <Snackbar open={Boolean(error)} message={error} autoHideDuration={6000} onClose={() => setError('')} />
    </Box>
  );
};

export default CustomerManagement;