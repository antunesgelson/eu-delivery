import axios, { AxiosInstance } from 'axios';
import { getClientCookies } from '@/utils/cookies';


const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL
}) as AxiosInstance


// interceptador de requisição
api.interceptors.request.use((config) => {
    const cookies = getClientCookies()
    const token = cookies['@eu:token'];
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});




export { api };
