import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMenu } from '../store/slices/menuSlice';
import { addToCart } from '../store/slices/cartSlice';

const Menu = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.menu);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Menu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
                <button 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.isAvailable}
                >
                  {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
              {item.isVegetarian && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Vegetarian
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
