import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import { Header, Footer } from './components/Layout';
import { ToastRoot } from './components/Toast';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout, { CheckoutSuccess } from './pages/Checkout';
import { Login, Register } from './pages/Auth';
import Account from './pages/Account';
import Promo from './pages/Promo';

export default function App() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    api.get('/categories/tree').then((r) => setCats(r.data)).catch(() => {});
  }, []);
  return (
    <BrowserRouter>
      <Header cats={cats} />
      <main style={{ minHeight: '60vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/san-pham" element={<Shop />} />
          <Route path="/san-pham/:slug" element={<ProductDetail />} />
          <Route path="/tim-kiem" element={<Shop />} />
          <Route path="/gio-hang" element={<Cart />} />
          <Route path="/thanh-toan" element={<Checkout />} />
          <Route path="/dat-hang-thanh-cong/:id" element={<CheckoutSuccess />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/tai-khoan/*" element={<Account />} />
          <Route path="/khuyen-mai" element={<Promo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastRoot />
    </BrowserRouter>
  );
}
