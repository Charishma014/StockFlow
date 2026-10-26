import apiClient from './apiClient';

export const categoryApi = {
  getAll: () => apiClient.get('/categories').then((r) => r.data),
  getById: (id) => apiClient.get(`/categories/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

export const productApi = {
  getAll: (params) => apiClient.get('/products', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/products/${id}`).then((r) => r.data),
  getLowStock: () => apiClient.get('/products/low-stock').then((r) => r.data),
  create: (data) => apiClient.post('/products', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/products/${id}`, data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export const inventoryApi = {
  addStock: (productId, data) => apiClient.post(`/inventory/${productId}/add`, data).then((r) => r.data),
  removeStock: (productId, data) => apiClient.post(`/inventory/${productId}/remove`, data).then((r) => r.data),
  getMovements: (productId) => apiClient.get('/inventory/movements', { params: { productId } }).then((r) => r.data),
  getRecentMovements: () => apiClient.get('/inventory/movements/recent').then((r) => r.data),
};

export const orderApi = {
  getAll: (status) => apiClient.get('/orders', { params: { status } }).then((r) => r.data),
  getById: (id) => apiClient.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/orders', data).then((r) => r.data),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};

export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats').then((r) => r.data),
};
