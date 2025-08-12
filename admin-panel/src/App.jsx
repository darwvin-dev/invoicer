import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Customers from './pages/Customers';
import Layout from './components/layouts/Layout';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/customers" element={<Customers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
