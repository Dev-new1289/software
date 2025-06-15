import React, { useState, useEffect } from 'react';
import {
  Box, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, MenuItem
} from '@mui/material';

const GenericDialog = ({ 
  open, 
  onClose, 
  data, 
  onSave, 
  fields, 
  title,
  saveButtonText = 'Save',
  saveButtonColor = 'primary',
  setData
}) => {
  const [formData, setFormData] = useState(data);

  // Sync the formData when the 'data' prop changes (for editing)
  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleInputChange = (field) => (event) => {
    const newValue = event.target.value;
    const newFormData = { ...formData, [field]: newValue };
    setFormData(newFormData);
    if (setData) {
      setData(newFormData);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {fields.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              variant="outlined"
              fullWidth
              value={formData[field.name] || ''}
              onChange={handleInputChange(field.name)}
              type={field.type === 'select' ? 'text' : field.type || 'text'}
              multiline={field.multiline || false}
              rows={field.rows || 1}
              select={field.type === 'select'}
              InputProps={{
                readOnly: field.readOnly || false
              }}
            >
              {field.type === 'select' && field.options && field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color={saveButtonColor} variant="contained">
          {saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenericDialog;