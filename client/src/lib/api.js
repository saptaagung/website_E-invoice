/**
 * API Client for InvoiceFlow
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get stored auth token
const getToken = () => localStorage.getItem('token');

// Set auth token
export const setToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

// Get current user from storage
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Set current user
export const setCurrentUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
};

// Base fetch wrapper with auth
const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        setToken(null);
        setCurrentUser(null);
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response;
};

// ============ AUTH ============
export const auth = {
    login: async (email, password) => {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        setCurrentUser(data.user);
        return data;
    },

    register: async (name, email, password) => {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        setToken(data.token);
        setCurrentUser(data.user);
        return data;
    },

    me: () => apiFetch('/auth/me'),

    logout: () => {
        setToken(null);
        setCurrentUser(null);
    },
};

// ============ CLIENTS ============
export const clients = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/clients${query ? `?${query}` : ''}`);
    },

    getOne: (id) => apiFetch(`/clients/${id}`),

    create: (data) => apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => apiFetch(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => apiFetch(`/clients/${id}`, {
        method: 'DELETE',
    }),
};

// ============ INVOICES ============
export const invoices = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/invoices${query ? `?${query}` : ''}`);
    },

    getOne: (id) => apiFetch(`/invoices/${id}`),

    create: (data) => apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => apiFetch(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => apiFetch(`/invoices/${id}`, {
        method: 'DELETE',
    }),

    // Add payment to invoice
    addPayment: (invoiceId, paymentData) => apiFetch(`/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
    }),

    // Download PDF
    downloadPDF: async (id, invoiceNumber) => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to download PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },
};

// ============ QUOTATIONS ============
export const quotations = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/quotations${query ? `?${query}` : ''}`);
    },

    getOne: (id) => apiFetch(`/quotations/${id}`),

    create: (data) => apiFetch('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => apiFetch(`/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => apiFetch(`/quotations/${id}`, {
        method: 'DELETE',
    }),

    // Download PDF
    downloadPDF: async (id, quotationNumber) => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/quotations/${id}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to download PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quotationNumber.replace(/\//g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },
};

// ============ SETTINGS ============
export const settings = {
    get: () => apiFetch('/settings'),

    update: (data) => apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    getBankAccounts: () => apiFetch('/settings/bank-accounts'),

    createBankAccount: (data) => apiFetch('/settings/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    updateBankAccount: (id, data) => apiFetch(`/settings/bank-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    deleteBankAccount: (id) => apiFetch(`/settings/bank-accounts/${id}`, {
        method: 'DELETE',
    }),
};

// Export all as default
export default {
    auth,
    clients,
    invoices,
    quotations,
    settings,
    setToken,
    getCurrentUser,
    setCurrentUser,
};
