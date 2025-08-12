import axiosInstance from './axiosInstance';

export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message);
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  delete axiosInstance.defaults.headers.common['Authorization'];
};

export const checkAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    await axiosInstance.get('/auth/check');
    return true;
  } catch (error) {
    logout();
    return false;
  }
};

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message);
  }
};