import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import GenericDialog from './components/GenericDialog';
import AreaTable from './components/AreaTable';
import SearchBar from './components/SearchBar';
import SortControl from './components/SortControl';
import {
  fetchAllAreas,
  fetchAllAreaGroups,
  addArea,
  editArea,
  deleteArea,
  addAreaGroup,
  editAreaGroup,
  deleteAreaGroup
} from '../api';

const AreaManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [areas, setAreas] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: '', direction: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    area_name: '',
    group_id: '',
    area_group: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter and sort areas
    let updatedAreas = areas.filter((area) =>
      Object.values(area).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter and sort groups
    let updatedGroups = groups.filter((group) =>
      Object.values(group).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    if (sortConfig.field) {
      const sortFunction = (a, b) => {
        const aField = a[sortConfig.field];
        const bField = b[sortConfig.field];
        if (sortConfig.direction === 'asc') {
          return aField > bField ? 1 : -1;
        } else {
          return aField < bField ? 1 : -1;
        }
      };
      updatedAreas = updatedAreas.sort(sortFunction);
      updatedGroups = updatedGroups.sort(sortFunction);
    }

    setFilteredAreas(updatedAreas);
    setFilteredGroups(updatedGroups);
  }, [areas, groups, searchQuery, sortConfig]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [areasResponse, groupsResponse] = await Promise.all([
        fetchAllAreas(),
        fetchAllAreaGroups()
      ]);
      setAreas(areasResponse.areas || []);
      setGroups(groupsResponse.groups || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error loading data',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchQuery('');
    setSortConfig({ field: '', direction: '' });
  };

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setIsEditing(true);
      setEditingId(item._id);
      if (activeTab === 0) {
        setFormData({
          area_name: item.area_name,
          group_id: item.group_id._id || item.group_id
        });
      } else {
        setFormData({
          area_group: item.area_group
        });
      }
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        area_name: '',
        group_id: '',
        area_group: ''
      });
    }
    setDialogOpen(true);
  };

  const handleFormDataChange = (newData) => {
    setFormData(newData);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      area_name: '',
      group_id: '',
      area_group: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 0) {
        if (!formData.area_name || !formData.group_id) {
          throw new Error('Please fill in all required fields');
        }
        const areaData = {
          area_name: formData.area_name,
          group_id: formData.group_id
        };
        if (isEditing) {
          await editArea(editingId, areaData);
        } else {
          await addArea(areaData);
        }
      } else {
        if (!formData.area_group) {
          throw new Error('Please enter a group name');
        }
        const groupData = {
          area_group: formData.area_group
        };
        if (isEditing) {
          await editAreaGroup(editingId, groupData);
        } else {
          await addAreaGroup(groupData);
        }
      }
      await loadData();
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: `${activeTab === 0 ? 'Area' : 'Group'} ${isEditing ? 'updated' : 'added'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error saving data',
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (activeTab === 0) {
        await deleteArea(itemToDelete._id);
      } else {
        await deleteAreaGroup(itemToDelete._id);
      }
      await loadData();
      setSnackbar({
        open: true,
        message: `${activeTab === 0 ? 'Area' : 'Group'} deleted successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error deleting item',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmDialog(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmDialog(false);
    setItemToDelete(null);
  };

  const getDialogFields = () => {
    if (activeTab === 0) {
      return [
        {
          name: 'area_name',
          label: 'Area Name',
          type: 'text',
          required: true
        },
        {
          name: 'group_id',
          label: 'Group',
          type: 'select',
          options: groups.map(group => ({
            value: group._id,
            label: group.area_group
          })),
          required: true
        }
      ];
    }
    return [
      {
        name: 'area_group',
        label: 'Group Name',
        type: 'text',
        required: true
      }
    ];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Area Management
        </Typography>

      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Areas" />
        <Tab label="Area Groups" />
      </Tabs>

      <SearchBar 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={`Search ${activeTab === 0 ? 'areas' : 'groups'}...`}
        sx={{ width: '80%', mb: 2 }}
      />

      <SortControl 
        value={sortConfig.field} 
        onChange={handleSortChange} 
        fields={activeTab === 0 ? ['area_name', 'group_name'] : ['area_group']} 
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Add New {activeTab === 0 ? 'Area' : 'Group'}
        </Button>
      </Box>



      {activeTab === 0 ? (
        <AreaTable
          data={filteredAreas}
          type="area"
          onEdit={handleOpenDialog}
          onDelete={handleDeleteClick}
        />
      ) : (
        <AreaTable
          data={filteredGroups}
          type="group"
          onEdit={handleOpenDialog}
          onDelete={handleDeleteClick}
        />
      )}

      <GenericDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        title={`${isEditing ? 'Edit' : 'Add New'} ${activeTab === 0 ? 'Area' : 'Group'}`}
        fields={getDialogFields()}
        data={formData}
        setData={handleFormDataChange}
      />

      <GenericDialog
        open={deleteConfirmDialog}
        onClose={handleDeleteCancel}
        onSave={handleDeleteConfirm}
        title="Confirm Delete"
        fields={[
          {
            name: 'confirmation',
            label: `Are you sure you want to delete this ${activeTab === 0 ? 'area' : 'group'}?`,
            type: 'text',
            readOnly: true
          }
        ]}
        data={{ confirmation: '' }}
        saveButtonText="Delete"
        saveButtonColor="error"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AreaManagement; 