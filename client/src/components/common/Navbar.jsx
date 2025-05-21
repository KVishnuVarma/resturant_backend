import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const Navbar = ({ onCartClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Restaurant App
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/menu" className="text-gray-600 hover:text-gray-900">Menu</Link>
            <Link to="/reservations" className="text-gray-600 hover:text-gray-900">Reservations</Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
                <button 
                  onClick={onCartClick}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <ShoppingCart />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/menu" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
              Menu
            </Link>
            <Link to="/reservations" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
              Reservations
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
                <button
                  onClick={onCartClick}
                  className="w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cart ({items.length})
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
