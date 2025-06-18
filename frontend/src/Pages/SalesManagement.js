import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Pagination } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchAllSales, getSaleById, getNextSaleId } from '../api';
import GenericTable from './components/GenericTable';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';
import CardView from './components/CardView';
import AddSaleDialog from './components/AddSaleDialog';
import { formatDateTime } from '../utils/dateUtils';

const SalesManagement = () => {
  const [salesList, setSalesList] = useState([]);
  const [filteredSalesList, setFilteredSalesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: '', direction: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [invNo, setInvoiceNo] = useState(0);

  const refreshSalesList = async () => {
    try {
      const [salesResponse, nextId] = await Promise.all([
        fetchAllSales(pagination.page, pagination.limit),
        getNextSaleId()
      ]);

      if (salesResponse && salesResponse.data && salesResponse.data.salesData) {
        const formattedSalesData = salesResponse.data.salesData.map(sale => ({
          ...sale,
          date: formatDateTime(sale.date),
        }));

        setSalesList(formattedSalesData);
        setFilteredSalesList(formattedSalesData);
        setPagination({
          ...pagination,
          totalPages: Math.ceil(salesResponse.data.pagination.total / pagination.limit),
        });
        setInvoiceNo(nextId);
      }
    } catch (error) {
      setError(error.message || 'Failed to refresh sales data');
    }
  };

  useEffect(() => {
    refreshSalesList();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    let updatedList = [...filteredSalesList];

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

    setFilteredSalesList(updatedList);
  }, [sortConfig]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredSalesList(salesList);
      return;
    }

    try {
      const response = await getSaleById(searchQuery);
      if (response && response.salesData) {
        const formattedSalesData = response.salesData.map(sale => ({
          ...sale,
          date: formatDateTime(sale.date),
        }));
        setFilteredSalesList(formattedSalesData);
      } else {
        setFilteredSalesList([]);
        setError('No sales found');
      }
    } catch (error) {
      setFilteredSalesList([]);
      setError(error.message || 'Failed to fetch sales data. Please try again.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      setFilteredSalesList(salesList);
      setError('');
    }
  };

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePaginationChange = (event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleOpenDialog = (sale = null) => {
    setEditingSale(sale);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingSale(null);
    refreshSalesList();
  };

  const salesColumns = [
    { label: 'Sale ID', accessor: 'sale_id' },
    { label: 'Date', accessor: 'date' },
    { label: 'Customer', accessor: 'customerNameWithAreaAndGroup' },
    { label: 'Amount', accessor: 'amount' },
    { label: 'Special Less', accessor: 'special_less' },
    { label: 'Remarks', accessor: 'remarks' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Sales Management</Typography>
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
          fields={['saleId', 'date', 'customer', 'amount']} 
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Sale
          </Button>
        </Box>
      </Box>

      <GenericTable
        data={filteredSalesList}
        columns={salesColumns}
        onEdit={handleOpenDialog}
        onSort={handleSortChange}
        sortConfig={sortConfig}
      />

      <CardView
        data={filteredSalesList}
        onEdit={handleOpenDialog}
        fields={[
          { name: 'sale_id', label: 'Sale ID' },
          { name: 'date', label: 'Date' },
          { name: 'customerNameWithAreaAndGroup', label: 'Customer' },
          { name: 'amount', label: 'Amount' },
          { name: 'special_less', label: 'Special Less' },
          { name: 'remarks', label: 'Remarks' },
        ]}
      />

      <AddSaleDialog
        open={openDialog}
        onClose={handleDialogClose}
        invNo={invNo}
        editingSale={editingSale}
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

export default SalesManagement;
