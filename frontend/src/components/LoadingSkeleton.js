import React from 'react';
import { Skeleton, Box, Grid } from '@mui/material';

export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <Box>
    {/* Header skeleton */}
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Grid item xs={12} sm={6} md={2} key={index}>
          <Skeleton variant="text" height={40} />
        </Grid>
      ))}
    </Grid>
    
    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Grid container spacing={2} key={rowIndex} sx={{ mb: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Grid item xs={12} sm={6} md={2} key={colIndex}>
            <Skeleton variant="rectangular" height={40} />
          </Grid>
        ))}
      </Grid>
    ))}
  </Box>
);

export const CardSkeleton = ({ cards = 6 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: cards }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} />
        </Box>
      </Grid>
    ))}
  </Grid>
);

export const DialogSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={300} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={40} />
          ))}
        </Box>
      </Grid>
    </Grid>
  </Box>
); 