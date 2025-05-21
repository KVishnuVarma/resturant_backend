import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { updateQuantity, removeFromCart } from '../../store/slices/cartSlice';
import { useNavigate } from 'react-router-dom';

const Cart = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // Calculate total
  const cartTotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const handleUpdateQuantity = (id, newQuantity) => {
    dispatch(updateQuantity({ id, quantity: newQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      onClose();
      return;
    }
    navigate('/checkout');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500">Your cart is empty</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="text-sm">{item.quantity}</span>
                        <button 
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-600 ml-2"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t p-4">
              <div className="flex justify-between mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
                onClick={handleCheckout}
              >
                {user ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
