import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import { useAuth } from './auth/AuthContext';
import { Header, Footer } from './components/Layout';
import ContactFab from './components/ContactFab';
import { ToastRoot } from './components/ui/toast';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout, { CheckoutSuccess } from './pages/Checkout';
import { Login, Register } from './pages/Auth';
import Account from './pages/Account';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Promo from './pages/Promo';
import OrderLookup from './pages/OrderLookup';
import { PolicyPage, FaqPage, AboutPage } from './pages/Pages';

const PolicyRoute = () => {
  const { slug } = useParams();
  return <PolicyPage slug={slug} />;
};

export default function App() {
  const { user, ready, mustChangePassword } = useAuth();
  const [cats, setCats] = useState([]);
  useEffect(() => {
    api.get('/categories/tree').then((r) => setCats(r.data)).catch(() => {});
  }, []);

  if (ready && user && mustChangePassword) {
    return (
      <>
        <Header cats={cats} />
        <ForcePasswordChange />
        <Footer />
        <ToastRoot />
      </>
    );
  }

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
          <Route path="/tra-cuu-don-hang" element={<OrderLookup />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/cau-hoi-thuong-gap" element={<FaqPage />} />
          <Route path="/chinh-sach/:slug" element={<PolicyRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ContactFab />
      <ToastRoot />
    </BrowserRouter>
  );
}
