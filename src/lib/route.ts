import axios from "axios";

const route = axios.create({
    baseURL: "http://localhost:3004", // 本番ではさくらVPSのIPなどに変更
});

route.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Token set in request headers:", token);
    }
    return config;
});

export default route;
