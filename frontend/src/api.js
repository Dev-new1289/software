import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });
// Custom error handler
const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return { message: data.message || 'Invalid request. Please check your input.', type: 'warning' };
      case 401:
        return { message: data.message || 'Authentication failed. Please log in again.', type: 'error' };
      case 403:
        return { message: data.message || 'You do not have permission to access this resource.', type: 'error' };
      case 404:
        return { message: data.message || 'The requested resource was not found.', type: 'warning' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'error' };
      default:
        return { message: data.message || 'An unexpected error occurred.', type: 'error' };
    }
  } else if (error.request) {
    return { message: 'No response received from server. Please check your network connection.', type: 'error' };
  } else {
    return { message: error.message || 'An unexpected error occurred.', type: 'error' };
  }
};

// Attach token to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth API functions
export const login = async (formData) => {
  try {
    const response = await API.post('/api/users/login', formData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchAllSales = async (page = 1, limit = 10) => {
  return API.get(`/api/sales/all?page=${page}&limit=${limit}`);
};

export const getSaleItems = async (id) => {
  return API.get(`/api/sales/sale-items/${id}`);
};

export async function getCustomers() {
  // e.g. GET /api/customers
  const response = await API.get(`/api/customers`);
  return response.data; // an array of customers
}

export async function getCustomersWithBalance() {
  // e.g. GET /api/customers
  const response = await API.get(`/api/customers/balance`);
  return response.data; // an array of customers
}
// Customer Management API functions
export const fetchAllCustomers = async () => {
  try {
    const response = await API.get('/api/customers');
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addCustomer = async (customerData) => {
  try {
    const response = await API.post('/api/customers', customerData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editCustomer = async (id, customerData) => {
  try {
    const response = await API.put(`/api/customers/${id}`, customerData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await API.delete(`/api/customers/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Load the inventory items
export async function getInventory() {
  // e.g. GET /api/inventory
  const response = await API.get(`/api/inventory`);
  return response.data; // array of { itemId, itemDescription, netRate, ...}
}

export const saveSale = async (saleData) => {
  try {
    const response = await API.post(`/api/sales/save-sale`, saleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error saving sale');
  }
};

export const editSale = async (saleData) => {
  try {
    const response = await API.put(`/api/sales/save-sale`, saleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error saving sale');
  }
};

// getCustomerDetails.js
export async function getCustomerDetails(customerId, date, invoiceId) {
  console.log(customerId, date, invoiceId)
  const response = await API.get(`/api/customers/${customerId}/details`, {
    params: {
      date,
      ...(invoiceId && { invoiceId })
    }
  });
  return response.data;
}

export const getSaleById = async (invoiceNo) => {
  const response = await API.get(`/api/sales/id`,{
      params: {
        searchQuery: invoiceNo
      }
    }
  );
  return response.data;
}

// Get all areas
export const getAreas = async () => {
  try {
    const response = await API.get('/api/customers/areas');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getNextSaleId = async () => {
  try {
    const response = await API.get('/api/sales/last-sale-id');
    return response.data.nextSaleId;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Area Management API functions
export const fetchAllAreas = async () => {
  try {
    const response = await API.get('/api/customers/areas');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addArea = async (areaData) => {
  try {
    const response = await API.post('/api/customers/areas', areaData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editArea = async (id, areaData) => {
  try {
    console.log(id, areaData)
    const response = await API.put(`/api/customers/areas/${id}`, areaData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteArea = async (id) => {
  try {
    const response = await API.delete(`/api/customers/areas/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Area Group Management API functions
export const fetchAllAreaGroups = async () => {
  try {
    const response = await API.get('/api/customers/area-groups');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addAreaGroup = async (groupData) => {
  try {
    const response = await API.post('/api/customers/area-groups', groupData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editAreaGroup = async (id, groupData) => {
  try {
    console.log(id, groupData)
    const response = await API.put(`/api/customers/area-groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteAreaGroup = async (id) => {
  try {
    const response = await API.delete(`/api/customers/area-groups/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Inventory Management API functions
export const fetchAllInventory = async () => {
  try {
    const response = await API.get('/api/inventory');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addInventory = async (inventoryData) => {
  try {
    const response = await API.post('/api/inventory', inventoryData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editInventory = async (id, inventoryData) => {
  try {
    const response = await API.put(`/api/inventory/${id}`, inventoryData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteInventory = async (id) => {
  try {
    const response = await API.delete(`/api/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Cash Management API functions
export const fetchAllCashData = async (page = 1, limit = 10) => {
  try {
    const response = await API.get(`/api/cash?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addCashData = async (cashData) => {
  try {
    const response = await API.post('/api/cash', cashData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editCashData = async (id, cashData) => {
  try {
    const response = await API.put(`/api/cash/${id}`, cashData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getNextCashInvoiceNo = async () => {
  try {
    const response = await API.get('/api/cash/last-invoice');
    return response.data.nextInvoiceNo;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const searchCashData = async (searchQuery) => {
  try {
    const response = await API.get('/api/cash/search', {
      params: { searchQuery }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteCashData = async (id) => {
  try {
    const response = await API.delete(`/api/cash/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAreaGroups = async () => {
  try {
    const response = await API.get('/api/customers/area-groups');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch area groups');
  }
};

export const getCustomersByGroup = async (groupId) => {
  try {
    const response = await API.get(`/api/customers/group/${groupId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch customers by group');
  }
};

export const getCustomersByGroupWithBalance = async (groupId) => {
  try {
    const response = await API.get(`/api/customers/group/${groupId}/balance`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch customers by group');
  }
};
export const addBulkCashData = async (cashEntries) => {
  try {
    const response = await API.post('/api/cash/bulk', { cashEntries });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add bulk cash data');
  }
};

export const getCustomerLedger = async (customerId, startDate, endDate) => {
  try {
    const response = await API.get(`/api/ledger/customer/${customerId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getIncomeReport = async (startDate, endDate, page = 1, limit = 10) => {
  try {
    const response = await API.get('/api/income/report', {
      params: { startDate, endDate, page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching income report data';
  }
};

export const getIncomeGrandTotal = async (startDate, endDate) => {
  try {
    const response = await API.get('/api/income/grand-total', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching grand total';
  }
};

export { handleApiError };
