import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchBar = ({ value, onChange, onSearch, placeholder, showSearchButton = false }) => {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        mb: 3,
      }}
    >
      <TextField
        variant="outlined"
        label={placeholder || "Search"}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder || "Enter search term"}
        sx={{
          width: '100%',
          maxWidth: 400,
          '& .MuiOutlinedInput-root': {
            borderRadius: '50px',
          },
        }}
      />
      {showSearchButton && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={onSearch}
          sx={{ borderRadius: '50px' }}
        >
          Search
        </Button>
      )}
    </Box>
  );
};

export default SearchBar;
