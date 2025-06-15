import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const AreaTable = ({ data, type, onEdit, onDelete }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        No {type === 'area' ? 'areas' : 'groups'} available
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper}
      elevation={2}
      sx={{
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
            {type === 'area' ? (
              <>
                <TableCell>Area Name</TableCell>
                <TableCell>Group Name</TableCell>
              </>
            ) : (
              <TableCell>Group Name</TableCell>
            )}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row._id}>
              {type === 'area' ? (
                <>
                  <TableCell>{row.area_name}</TableCell>
                  <TableCell>{row.group_name}</TableCell>
                </>
              ) : (
                <TableCell>{row.area_group}</TableCell>
              )}
              <TableCell>
                <IconButton 
                  color="primary" 
                  onClick={() => onEdit(row)}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  color="error" 
                  onClick={() => onDelete(row)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AreaTable; 