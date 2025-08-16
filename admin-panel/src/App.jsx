import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Layout from './components/layouts/Layout';
import InvoiceManagement from './pages/Invoice';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import DailyReports from './pages/DailyReports';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/customers" element={<Customers />} />
          <Route path="/daily-reports" element={<DailyReports />} />
          <Route path="/invoices" element={<InvoiceManagement />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={2500} />
    </BrowserRouter>
  );
}

export default App;
