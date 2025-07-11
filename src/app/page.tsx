"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./LoginForm.module.css";

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/login", { email, password });
            const token = res.data.token;
            localStorage.setItem("token", token);
            router.push("/photos");
        } catch (err) {
            console.error("Login error:", err);

            // エラーレスポンスからメッセージを取得
            if (err instanceof Error) {
                setError(err.message || "ログインに失敗しました");
            } else if (err && typeof err === "object" && "response" in err) {
                const axiosError = err as {
                    response?: { data?: { message?: string; error?: string }; status?: number };
                };

                // HTTPステータスコードに基づいてエラーメッセージを設定
                if (axiosError.response?.status === 401) {
                    setError("メールアドレスまたはパスワードが間違っています");
                } else if (axiosError.response?.status === 404) {
                    setError("アカウントが見つかりません");
                } else if (axiosError.response?.status === 500) {
                    setError("サーバーエラーが発生しました");
                } else {
                    const errorMessage =
                        axiosError.response?.data?.message ||
                        axiosError.response?.data?.error ||
                        "ログインに失敗しました";
                    setError(errorMessage);
                }
            } else {
                setError("ネットワークエラーが発生しました");
            }
        }
    };

    return (
        <div className={styles.loginWrapper}>
            <form onSubmit={handleLogin} className={styles.loginCard}>
                <h1 className={styles.loginTitle}>ログイン</h1>

                {error && <p className={styles.loginError}>{error}</p>}

                <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.loginInput}
                    required
                />

                <input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.loginInput}
                    required
                />

                <button type="submit" className={styles.loginButton}>
                    ログイン
                </button>

                <div className={styles.linkContainer}>
                    <p className={styles.linkText}>
                        アカウントをお持ちでない方は{" "}
                        <button
                            type="button"
                            onClick={() => router.push("/signin")}
                            className={styles.linkButton}
                        >
                            新規登録
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
}
