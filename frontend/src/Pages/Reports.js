import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSalesSummaryReport, getItemsSoldByMonthReport } from '../api';

// Helper: get last 12 months as [{ label: 'YYYY-MM', start, end }]
function getLast12Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const label = `${year}-${month}`;
    const start = `${label}-01`;
    // Get last day of month
    const endDate = new Date(year, d.getMonth() + 1, 0);
    const end = `${year}-${month}-${String(endDate.getDate()).padStart(2, '0')}`;
    months.push({ label, start, end });
  }
  return months.reverse(); // oldest to newest
}

// A large color palette for bars
const BAR_COLORS = [
  '#1976d2', '#2e7d32', '#ff9800', '#d32f2f', '#7b1fa2', '#0288d1', '#cddc39',
  '#f44336', '#00bcd4', '#8bc34a', '#ffc107', '#e91e63', '#9c27b0', '#3f51b5',
  '#009688', '#4caf50', '#ffeb3b', '#ff5722', '#607d8b', '#bdbdbd', '#6d4c41',
  '#ffb300', '#43a047', '#1e88e5', '#c62828', '#ad1457', '#4527a0', '#00838f',
  '#689f38', '#fbc02d', '#f06292', '#7e57c2', '#64b5f6', '#388e3c', '#ffa726',
];

export default function Reports() {
  const months = getLast12Months();
  const [selectedMonth, setSelectedMonth] = useState(months[months.length - 1]); // default: latest month

  // Sales summary state
  const [salesSummary, setSalesSummary] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [errorSales, setErrorSales] = useState(null);

  // Items sold state
  const [itemsSold, setItemsSold] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState(null);

  // Fetch sales summary for selected month
  useEffect(() => {
    setLoadingSales(true);
    setErrorSales(null);
    setSalesSummary(null);
    getSalesSummaryReport(selectedMonth.start, selectedMonth.end)
      .then((data) => {
        setSalesSummary(data.data || []);
        setLoadingSales(false);
      })
      .catch((err) => {
        setErrorSales(err.message || 'Failed to load sales summary');
        setLoadingSales(false);
      });
  }, [selectedMonth]);

  // Fetch items sold for selected month
  useEffect(() => {
    setLoadingItems(true);
    setErrorItems(null);
    setItemsSold(null);
    getItemsSoldByMonthReport(selectedMonth.start, selectedMonth.end)
      .then((data) => {
        setItemsSold(data.data || []);
        setLoadingItems(false);
      })
      .catch((err) => {
        setErrorItems(err.message || 'Failed to load items sold report');
        setLoadingItems(false);
      });
  }, [selectedMonth]);

  // Transform data for horizontal bar chart: [{ item: 'Item Name', quantity: 123 }, ...]
  function getItemChartData(data) {
    if (!data || data.length === 0) return [];
    // Only one month row is expected
    const monthRow = data[0];
    if (!monthRow.items) return [];
    // Sort items by sequence (as string, numeric-aware)
    const sortedItems = [...monthRow.items].sort((a, b) =>
      (a.sequence || '').localeCompare(b.sequence || '', undefined, { numeric: true })
    );
    return sortedItems.map(({ name, quantity }) => ({ item: name, quantity }));
  }

  function ItemsSoldReport({ data }) {
    if (!data || data.length === 0) return <Alert severity="info">No items sold for this month.</Alert>;
    const chartData = getItemChartData(data);
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Items Sold (Quantity per Item)</Typography>
        <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 28)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" label={{ value: 'Quantity', position: 'insideBottomRight', offset: -5 }} />
            <YAxis dataKey="item" type="category" width={220} interval={0} />
            <Tooltip />
            <Bar dataKey="quantity" name="Quantity Sold">
              {chartData.map((entry, idx) => (
                <Cell key={entry.item} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // Get summary values for the selected month
  const summary = (salesSummary && salesSummary.length > 0) ? salesSummary[0] : null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <FormControl sx={{ minWidth: 200, mb: 3 }} size="small">
        <InputLabel id="month-select-label">Month</InputLabel>
        <Select
          labelId="month-select-label"
          value={selectedMonth.label}
          label="Month"
          onChange={e => {
            const m = months.find(m => m.label === e.target.value);
            setSelectedMonth(m);
          }}
        >
          {months.map(m => (
            <MenuItem key={m.label} value={m.label}>{m.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* Summary cards row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Total Sales</Typography>
              <Typography variant="h5" color="primary">
                {loadingSales ? <CircularProgress size={24} /> : summary ? `Rs ${summary.sales.toLocaleString()}` : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Total Cash Received</Typography>
              <Typography variant="h5" color="success.main">
                {loadingSales ? <CircularProgress size={24} /> : summary ? `Rs ${summary.cash.toLocaleString()}` : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Total Profit</Typography>
              <Typography variant="h5" color="secondary">
                {loadingSales ? <CircularProgress size={24} /> : summary ? `Rs ${summary.profit.toLocaleString()}` : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {loadingItems ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : errorItems ? (
            <Alert severity="error">{errorItems}</Alert>
          ) : (
            <ItemsSoldReport data={itemsSold} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
