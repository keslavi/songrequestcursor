import { Navigate } from 'react-router-dom';
import authStore from '../stores/auth/store';

const ProtectedRoute = ({ children, allowGuest = false, allowedRoles = [] }) => {
  const { user, isAuthenticated } = authStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }));

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowGuest && user?.isGuest) {
    return <Navigate to="/" />;
  }

  // If allowedRoles is provided, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute; 