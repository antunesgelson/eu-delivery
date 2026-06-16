'use client'
import { getClientCookies } from "@/utils/cookies";
import { useEffect, useState } from "react";

export default function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const cookies = getClientCookies();
        const token = cookies['@eu:token'];
        setIsAuthenticated(!!token);
    }, []);

    return { isAuthenticated };
}
