import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  TableSortLabel,
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon, Close as CloseIcon } from '@mui/icons-material';
import { fetchAllInventory, addInventory, editInventory, deleteInventory } from '../api';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: '', direction: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [formData, setFormData] = useState({
    length: '',
    gauge: '',
    net_rate: '',
    cost: '',
    stock: '',
    sequence: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    let updatedList = inventory.filter((item) =>
      Object.values(item).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredInventory(updatedList);
  }, [inventory, searchQuery, sortConfig]);

  const loadInventory = async () => {
    try {
      const data = await fetchAllInventory();
      setInventory(data);
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setFormData({
        length: item.length,
        gauge: item.gauge,
        net_rate: item.net_rate,
        cost: item.cost,
        sequence: item.sequence,
      });
      setEditingItem(item);
    } else {
      setFormData({
        length: '',
        gauge: '',
        net_rate: '',
        cost: '',
        stock: '',
        sequence: ''
      });
      setEditingItem(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      length: '',
      gauge: '',
      net_rate: '',
      cost: '',
      stock: '',
      sequence: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await editInventory(editingItem._id, formData);
        showSnackbar('Inventory item updated successfully');
      } else {
        await addInventory(formData);
        showSnackbar('Inventory item added successfully');
      }
      handleCloseDialog();
      loadInventory();
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await deleteInventory(id);
        showSnackbar(response.message || 'Inventory item deleted successfully');
        loadInventory();
      } catch (error) {
        showSnackbar(
          error.response?.data?.message || 
          'Cannot delete this item as it is being used in sales records', 
          'error'
        );
      }
    }
  };

  const handleCellEdit = (item, field) => {
    setEditingCell({ id: item._id, field });
  };

  const handleCellSave = async (item, field, value) => {
    try {
      const updatedData = { ...item, [field]: value };
      await editInventory(item._id, updatedData);
      setInventory(prev => 
        prev.map(i => i._id === item._id ? updatedData : i)
      );
      showSnackbar('Item updated successfully');
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderCell = (item, field) => {
    const isEditing = editingCell?.id === item._id && editingCell?.field === field;
    const value = item[field];

    if (isEditing) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              setInventory(prev =>
                prev.map(i =>
                  i._id === item._id ? { ...i, [field]: newValue } : i
                )
              );
            }}
            onKeyDown={(e) => {
              const fields = ['length', 'gauge', 'net_rate', 'cost', 'stock', 'sequence'];
              if (e.key === 'Enter') {
                handleCellSave(item, field, value);
              } else if (e.key === 'Escape') {
                handleCellCancel();
              } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = fields.indexOf(field);
                if (currentIndex < fields.length - 1) {
                  handleCellSave(item, field, value);
                  handleCellEdit(item, fields[currentIndex + 1]);
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = fields.indexOf(field);
                if (currentIndex > 0) {
                  handleCellSave(item, field, value);
                  handleCellEdit(item, fields[currentIndex - 1]);
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const currentIndex = inventory.findIndex(i => i._id === item._id);
                if (currentIndex < inventory.length - 1) {
                  handleCellSave(item, field, value);
                  handleCellEdit(inventory[currentIndex + 1], field);
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const currentIndex = inventory.findIndex(i => i._id === item._id);
                if (currentIndex > 0) {
                  handleCellSave(item, field, value);
                  handleCellEdit(inventory[currentIndex - 1], field);
                }
              }
            }}
            autoFocus
          />
          <IconButton
            size="small"
            onClick={() => handleCellSave(item, field, value)}
            color="primary"
          >
            <SaveIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleCellCancel}
            color="error"
          >
            <CancelIcon />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
        }}
        onClick={() => handleCellEdit(item, field)}
      >
        {field === 'stock' ? parseInt(value) || 0 : (typeof value === 'number' ? value.toFixed(2) : value)}
      </Box>
    );
  };

  // Calculate total amount (cost * stock)
  const totalAmount = filteredInventory.reduce((sum, item) => sum + ((parseFloat(item.cost) || 0) * (parseInt(item.stock) || 0)), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Inventory Management</Typography>
      </Box>

      <SearchBar 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search inventory..."
        sx={{ width: '80%', mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Item
        </Button>
      </Box>

      <SortControl 
        value={sortConfig.field} 
        onChange={handleSortChange} 
        fields={['length', 'gauge', 'net_rate', 'cost', 'stock', 'sequence']} 
      />

      <TableContainer 
        component={Paper}
        elevation={2}
        sx={{
          display: { xs: 'none', md: 'block' },
          overflowX: 'auto',
          borderRadius: '12px',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Table>
          <TableHead
            sx={{
              backgroundColor: '#333',
              '& th': {
                color: '#fff',
                fontWeight: 'bold',
                textAlign: 'left',
              },
            }}
          >
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'length'}
                  direction={sortConfig.field === 'length' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('length')}
                >
                  Length
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'gauge'}
                  direction={sortConfig.field === 'gauge' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('gauge')}
                >
                  Gauge
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'net_rate'}
                  direction={sortConfig.field === 'net_rate' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('net_rate')}
                >
                  Net Rate
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'cost'}
                  direction={sortConfig.field === 'cost' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('cost')}
                >
                  Cost
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'stock'}
                  direction={sortConfig.field === 'stock' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('stock')}
                >
                  Stock
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'sequence'}
                  direction={sortConfig.field === 'sequence' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSortChange('sequence')}
                >
                  Sequence
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{renderCell(item, 'length')}</TableCell>
                <TableCell>{renderCell(item, 'gauge')}</TableCell>
                <TableCell>{renderCell(item, 'net_rate')}</TableCell>
                <TableCell>{renderCell(item, 'cost')}</TableCell>
                <TableCell>{renderCell(item, 'stock')}</TableCell>
                <TableCell>{renderCell(item, 'sequence')}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDelete(item._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {/* Total row */}
            <TableRow>
              <TableCell colSpan={5} align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Amount :
                </Typography>
              </TableCell>
              <TableCell colSpan={2} align="left">
                <Typography variant="subtitle1" fontWeight="bold">
                  {totalAmount.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
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
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
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
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column' }}>
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
                    Length
                  </Typography>
                  <TextField
                    name="length"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.length}
                    onChange={handleInputChange}
                    placeholder="Enter length"
                    InputLabelProps={{ shrink: false }}
                  />
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
                    Gauge
                  </Typography>
                  <TextField
                    name="gauge"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.gauge}
                    onChange={handleInputChange}
                    placeholder="Enter gauge"
                    InputLabelProps={{ shrink: false }}
                  />
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
                    Net Rate
                  </Typography>
                  <TextField
                    name="net_rate"
                    type="number"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.net_rate}
                    onChange={handleInputChange}
                    placeholder="Enter net rate"
                    InputLabelProps={{ shrink: false }}
                  />
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
                    Cost
                  </Typography>
                  <TextField
                    name="cost"
                    type="number"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="Enter cost"
                    InputLabelProps={{ shrink: false }}
                  />
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
                    Sequence
                  </Typography>
                  <TextField
                    name="sequence"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.sequence}
                    onChange={handleInputChange}
                    placeholder="Enter sequence"
                    InputLabelProps={{ shrink: false }}
                  />
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
                    Stock
                  </Typography>
                  <TextField
                    name="stock"
                    type="number"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="Enter stock quantity"
                    InputLabelProps={{ shrink: false }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
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
            onClick={handleCloseDialog} 
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
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryManagement; 