import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Snackbar,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { getIncomeReport, getIncomeGrandTotal, getGrandTotalProfit } from '../api';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const IncomeReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [grandTotal, setGrandTotal] = useState(null);

  // Set current date to both start and end date fields on component mount
  useEffect(() => {
    const currentDate = getCurrentDateForInput();
    setStartDate(currentDate);
    setEndDate(currentDate);
  }, []);

  const handleGenerateReport = async (pageNumber = 1) => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await getIncomeReport(startDate, endDate, pageNumber, limit);
      if (response.success) {
        setReportData(response);
        setPage(pageNumber);

        if (response.pagination.isLastPage && !grandTotal) {
          const grandTotalData = await getIncomeGrandTotal(startDate, endDate);
          setGrandTotal(grandTotalData.grandTotalProfit);
        }
      } else {
        setError(response.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    handleGenerateReport(newPage);
  };

  const handleLimitChange = (event) => {
    const newLimit = event.target.value;
    setLimit(newLimit);
    setPage(1);
    handleGenerateReport(1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      handleGenerateReport(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < reportData.pagination.totalPages) {
      handleGenerateReport(page + 1);
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

  const renderMobileCard = (sale) => (
    <Card key={sale.saleId} sx={{ mb: 2, boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Invoice #{sale.saleId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(sale.date)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sale.customerName}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        {sale.items.map((item, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {item.name}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Qty: {item.quantity}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" align="right">
                  Price: {formatCurrency(item.rate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Amount: {formatCurrency(item.amount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" align="right">
                  Sale: {formatCurrency(item.saleAmount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cost: {formatCurrency(item.cost)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" align="right">
                  Profit: {formatCurrency(item.profit)}
                </Typography>
              </Grid>
            </Grid>
            {index < sale.items.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Invoice Total:
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {formatCurrency(sale.profit)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    setGrandTotal(null);
  }, [startDate, endDate]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Income Report
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Items per page</InputLabel>
              <Select
                value={limit}
                onChange={handleLimitChange}
                label="Items per page"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>

              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleGenerateReport(1)}
              disabled={loading}
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <>
          {/* Desktop Table View */}
          <Box sx={{ 
            display: { xs: 'none', md: 'block' }, 
            position: 'relative',
            width: '100%',
            overflow: 'auto'
          }}>
            <TableContainer 
              component={Paper}
              elevation={2}
              sx={{
                overflowX: 'auto',
                borderRadius: '12px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                mx: 2,
                '& .MuiTable-root': {
                  '& th:first-of-type': {
                    borderTopLeftRadius: '12px',
                  },
                  '& th:last-child': {
                    borderTopRightRadius: '12px',
                  },
                  '& tr:last-child td:first-of-type': {
                    borderBottomLeftRadius: '12px',
                  },
                  '& tr:last-child td:last-child': {
                    borderBottomRightRadius: '12px',
                  }
                }
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
                      borderBottom: 'none',
                      backgroundColor: '#333',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '1px',
                        backgroundColor: 'rgba(255, 255, 255, 0.12)'
                      }
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Item Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Sale</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.sales.map((sale) => (
                    <React.Fragment key={sale.saleId}>
                      {sale.items.map((item, index) => (
                        <TableRow key={`${sale.saleId}-${item.itemId}`}>
                          {index === 0 && (
                            <>
                              <TableCell rowSpan={sale.items.length}>
                                {formatDate(sale.date)}
                              </TableCell>
                              <TableCell rowSpan={sale.items.length}>
                                {sale.saleId}
                              </TableCell>
                              <TableCell rowSpan={sale.items.length}>
                                {sale.customerName}
                              </TableCell>
                            </>
                          )}
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.saleAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.profit)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={8} align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            Invoice Total:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatCurrency(sale.profit)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  {reportData.pagination.isLastPage && grandTotal !== null && (
                    <TableRow>
                      <TableCell colSpan={8} align="right">
                        <Typography variant="h6" fontWeight="bold">
                          Grand Total:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(grandTotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {reportData.sales.map(renderMobileCard)}
            {reportData.pagination.isLastPage && grandTotal !== null && (
              <Card sx={{ mt: 2, mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Grand Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Page {page} of {reportData.pagination.totalPages}
              </Typography>
              <Pagination
                count={reportData.pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                showFirstButton
                showLastButton
                size="small"
              />
            </Box>
          </Box>

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            message={error}
          />
        </>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
    </Box>
  );
};

export default IncomeReport; 