import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { getAreaGroups, getCustomersByGroupWithBalance, getCustomersWithBalance } from '../api';

const AccountReceivable = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
        try {
            const response = await getAreaGroups();
            if (response && response.groups) {
              console.log(response.groups);
              setGroups(response.groups);
            }
          } catch (error) {
            console.error('Error loading groups:', error);
          }

    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedGroup === 'all') {
          data = await getCustomersWithBalance();
          setCustomers(data.customers || data);
        } else {
          data = await getCustomersByGroupWithBalance(selectedGroup);
          setCustomers(data.customers || data);
        }
      } catch (err) {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [selectedGroup]);

  // Only show customers with non-zero balance
  const customersWithBalance = customers.filter(c => c.balance && c.balance !== 0);
  const totalBalance = customersWithBalance.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Account Receivable
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Group</InputLabel>
          <Select
            value={selectedGroup}
            label="Group"
            onChange={e => setSelectedGroup(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {groups.map(group => (
              <MenuItem key={group._id} value={group._id }>
                {group.area_group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Name</TableCell>
                <TableCell>Area</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customersWithBalance.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>{customer.customer_name || customer.name}</TableCell>
                  <TableCell>{customer.area_name}</TableCell>
                  <TableCell align="right">{customer.balance?.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 })}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>{totalBalance.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 })}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AccountReceivable; 