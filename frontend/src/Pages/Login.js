import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { TextField, Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Image from '../assets/images.jpeg';

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorType, setErrorType] = useState('error');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login(formData);
      localStorage.setItem('token', data.token);
      setAuth(true);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.message || 'Login failed');
      setErrorType(error.type || 'error');
      setOpenSnackbar(true);
    }
  };


  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Grid container style={{ minHeight: '100vh' }}>
      {/* Left Section */}
      <Grid
        size={{ xs: 12, md: 7 }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ padding: '20px' }}
      >
        <Box width="100%" maxWidth="400px" display="flex" flexDirection="column" alignItems="center">
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={errorType === 'warning' ? 'warning' : errorType} sx={{ width: '100%' }}>
              {errorMessage}
            </Alert>
          </Snackbar>
          
          <Typography variant="h4" gutterBottom>
            Welcome
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Login to access
          </Typography>


            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                label="Email"
                type="name"
                fullWidth
                margin="normal"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Button variant="contained" color="primary" type="submit" fullWidth style={{ marginTop: '16px', padding: '10px' }}>
                Login
              </Button>

            </form>

        </Box>
      </Grid>

      {/* Right Section */}
      <Grid
        size={{ xs: 12, md: 5 }}
        style={{
          backgroundImage: `url(${Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            width: '100%',
          }}
        >
          <Typography variant="h3" gutterBottom style={{ fontWeight: 'bold' }}>
      
          </Typography>
          <Typography variant="subtitle1" style={{ textAlign: 'center' }}>

          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
