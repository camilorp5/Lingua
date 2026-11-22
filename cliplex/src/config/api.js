const configuredApiBaseUrl = import.meta.env.API_BASE_URL_VITE || '';

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');
