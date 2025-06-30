import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Pagination } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchAllSales, getSaleById, getNextSaleId, getCustomers, getInventory, getSaleItems, getCustomerDetails } from '../api';
import GenericTable from './components/GenericTable';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';
import CardView from './components/CardView';
import AddSaleDialog from './components/AddSaleDialog';
import { formatDateTime, parseDDMMYYYYToISO, toLocalISOString } from '../utils/dateUtils';
import SalePrintPreview from './components/SalePrintPreview';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [viewingSale, setViewingSale] = useState(null);
  const [viewPrintData, setViewPrintData] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  const loadCustomersAndInventory = async () => {
    try {
      const [customersResponse, inventoryResponse] = await Promise.all([
        getCustomers(),
        getInventory()
      ]);
      
      setCustomers(customersResponse.customers || []);
      setInventory(inventoryResponse || []);
    } catch (error) {
      setError(error.message || 'Failed to load customers and inventory data');
    }
  };

  useEffect(() => {
    refreshSalesList();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    loadCustomersAndInventory();
  }, []);

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
    loadCustomersAndInventory();
  };

  const handleViewSale = async (sale) => {
    try {
      // 1. Fetch sale items
      const saleItemsResp = await getSaleItems(sale._id);
      const saleItems = saleItemsResp && saleItemsResp.data && saleItemsResp.data.saleItems ? saleItemsResp.data.saleItems : [];

      // 2. Convert date to correct format for getCustomerDetails
      let convertedDate = sale.date;
      if (typeof sale.date === 'string' && sale.date.includes('/')) {
        // Likely DD/MM/YYYY HH:MM format
        convertedDate = parseDDMMYYYYToISO(sale.date);
      } else {
        convertedDate = toLocalISOString(sale.date);
      }

      // 3. Fetch customer details (for area, less, balance)
      const customerId = sale.cust_id?._id || sale.cust_id;
      const customerDetails = await getCustomerDetails(customerId, convertedDate, sale._id);

      // 4. Calculate netAmount, lessAmount, receivable, totalAmount as in AddSaleDialog
      let sum = 0;
      saleItems.forEach((it) => {
        sum += (it.quantity * it.rate) || 0;
      });
      const netAmount = sum;
      const special = parseFloat(sale.special_less) || 0;
      let lessAmount = 0;
      let receivable = netAmount;
      if (special > 0 && special <= 100) {
        lessAmount = Math.round((netAmount * special) / 100.0);
        receivable = Math.round(netAmount - (netAmount * special / 100));
      }
      const prevBalance = customerDetails.balance || 0;
      const totalAmount = Math.round(prevBalance + receivable);

      // 5. Compose printData (match AddSaleDialog)
      setViewPrintData({
        invoiceNo: sale.sale_id,
        date: new Date(convertedDate),
        customer: sale.cust_id?.customer_name || sale.customerNameWithAreaAndGroup || '',
        area: customerDetails.area || '',
        items: saleItems
          .slice() // create a shallow copy to avoid mutating original
          .sort((a, b) => {
            // Sort by sequence as strings
            return a.item_id.sequence.localeCompare(b.item_id.sequence, undefined, { numeric: true });
          })
            .map(item => ({
            ...item,
            itemDescription: item.item_id?.length + ' ' + item.item_id?.gauge,
            qty: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        netAmount,
        specialLess: sale.special_less,
        lessAmount,
        receivable,
        prevBalance,
        totalAmount,
        remarks: sale.remarks,
      });
      setShowPrintPreview(true);
    } catch (err) {
      setError('Failed to load sale details for print preview');
    }
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
            disabled={invNo === 0}
          >
            {invNo === 0 ? "Loading..." : "Add New Sale"}
          </Button>
        </Box>
      </Box>

      <GenericTable
        data={filteredSalesList}
        columns={salesColumns}
        onEdit={handleOpenDialog}
        onView={handleViewSale}
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
        extraActions={(row) => (
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewSale(row)}>
            View
          </Button>
        )}
      />

      <AddSaleDialog
        open={openDialog}
        onClose={handleDialogClose}
        invNo={invNo}
        editingSale={editingSale}
        customers={customers}
        inventory={inventory}
      />

      {showPrintPreview && viewPrintData && (
        <SalePrintPreview
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          saleData={viewPrintData}
          onPrint={() => window.print()}
          readOnly
        />
      )}

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
