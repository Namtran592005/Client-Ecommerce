import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { CartProvider } from './cart/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
