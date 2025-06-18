import React, { useState, useEffect } from 'react';
import {
  Box, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Button, 
  MenuItem,
  Grid,
  useTheme,
  useMediaQuery,
  Typography,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const GenericDialog = ({ 
  open, 
  onClose, 
  data, 
  onSave, 
  fields, 
  title,
  saveButtonText = 'Save',
  saveButtonColor = 'primary',
  setData,
  maxWidth = 'md'
}) => {
  const [formData, setFormData] = useState(data);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

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

  // Determine grid size based on screen size and field type
  const getGridSize = (field) => {
    if (isSmallScreen) return 12; // Full width on small screens
    
    // Large fields (multiline, textarea) take full width
    if (field.multiline || field.type === 'textarea') return 12;
    
    // Medium fields take half width on medium+ screens
    if (field.size === 'medium') return isMediumScreen ? 12 : 6;
    
    // Small fields can fit 2-3 per row
    if (field.size === 'small') return isMediumScreen ? 6 : 4;
    
    // Default: half width on medium+ screens
    return isMediumScreen ? 12 : 6;
  };

  // Group fields by sections if specified
  const renderFieldGroups = () => {
    const groups = fields.reduce((acc, field) => {
      const group = field.group || 'default';
      if (!acc[group]) acc[group] = [];
      acc[group].push(field);
      return acc;
    }, {});

    return Object.entries(groups).map(([groupName, groupFields], groupIndex) => (
      <Box key={groupName} sx={{ mb: groupIndex < Object.keys(groups).length - 1 ? 3 : 0 }}>
        {groupName !== 'default' && (
          <>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              {groupName}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        <Box sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {groupFields.map((field) => (
            <Grid item xs={12} sm={getGridSize(field)} key={field.name}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Field Label */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: isSmallScreen ? '0.875rem' : '1.2rem',
                    mb: 0.5
                  }}
                >
                  {field.label}
                  {field.required && (
                    <Typography 
                      component="span" 
                      sx={{ 
                        color: 'error.main',
                        ml: 0.5,
                        fontSize: 'inherit'
                      }}
                    >
                      *
                    </Typography>
                  )}
                </Typography>
                
                {/* Field Input */}
                <TextField
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={formData[field.name] || ''}
                  onChange={handleInputChange(field.name)}
                  type={field.type === 'select' ? 'text' : field.type || 'text'}
                  multiline={field.multiline || false}
                  rows={field.rows || 1}
                  select={field.type === 'select'}
                  required={field.required || false}
                  helperText={field.helperText}
                  error={field.error}
                  placeholder={field.placeholder}
                  InputProps={{
                    readOnly: field.readOnly || false,
                    startAdornment: field.startAdornment,
                    endAdornment: field.endAdornment,
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: field.readOnly ? 'rgba(0, 0, 0, 0.12)' : undefined,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: field.readOnly ? 'rgba(0, 0, 0, 0.12)' : undefined,
                      },
                      backgroundColor: field.readOnly ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    }
                  }}
                  InputLabelProps={{
                    shrink: false, // Don't show the built-in label since we have custom ones
                    sx: {
                      color: field.readOnly ? 'rgba(0, 0, 0, 0.6)' : undefined,
                    }
                  }}
                  sx={{
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: field.readOnly ? 'rgba(0, 0, 0, 0.6)' : 'primary.main',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: field.readOnly ? 'rgba(0, 0, 0, 0.12)' : 'primary.main',
                    }
                  }}
                >
                  {field.type === 'select' && field.options && field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    ));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
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
          {title}
        </Typography>
        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
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
        </Tooltip>
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
          {renderFieldGroups()}
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
          onClick={onClose} 
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
          color={saveButtonColor} 
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
          {saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenericDialog;