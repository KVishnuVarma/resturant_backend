import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import MainLayout from './layouts/MainLayout';
import Routes from './routes';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <MainLayout>
          <Routes />
        </MainLayout>
      </Router>
    </Provider>
  );
}

export default App;
