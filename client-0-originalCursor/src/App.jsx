import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateShowPage from './pages/CreateShowPage';
import ProtectedRoute from './components/ProtectedRoute';
import authStore from './stores/auth';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

dayjs.extend(utc);
dayjs.extend(timezone);

function App() {
  const checkAuth = authStore((state) => state.checkAuth);

  console.log("checking isEmpty (' ')", isEmpty(" "));

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/shows/create" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'performer']}>
                    <CreateShowPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <ToastContainer position="bottom-right" />
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 