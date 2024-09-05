'use client'
import { parseCookies } from "nookies";
import { useEffect, useState } from "react";

export default function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const cookies = parseCookies();
        const token = cookies['@eu:token'];
        setIsAuthenticated(!!token);
    }, []);

    return { isAuthenticated };
}
