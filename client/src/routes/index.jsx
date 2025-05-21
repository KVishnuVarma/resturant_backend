import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';

import Home from '../pages/Home';
import Menu from '../pages/Menu';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Orders from '../pages/Orders';
import Reservations from '../pages/Reservations';
import Profile from '../pages/Profile';

const PrivateRoute = ({ children }) => {
  const { token, user } = useSelector(state => state.auth);
  const location = useLocation();

  if (!token) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { token } = useSelector(state => state.auth);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (token) {
    return <Navigate to={from} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        <Route path="/register" element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/orders" element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        } />
        <Route path="/reservations" element={
          <PrivateRoute>
            <Reservations />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
