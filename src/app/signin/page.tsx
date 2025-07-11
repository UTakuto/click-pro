"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./SigninForm.module.css";

export default function SigninPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // バリデーション
        if (!name.trim()) {
            setError("名前を入力してください");
            return;
        }

        if (!email.trim()) {
            setError("メールアドレスを入力してください");
            return;
        }

        if (password.length < 6) {
            setError("パスワードは6文字以上で入力してください");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/users", {
                name: name.trim(),
                email: email.trim(),
                password,
            });

            if (res.status === 201 || res.status === 200) {
                router.push("/photos");
            }
        } catch (err) {
            console.error("User create error:", err);

            // エラーレスポンスからメッセージを取得
            if (err instanceof Error) {
                setError(err.message || "登録に失敗しました");
            } else if (err && typeof err === "object" && "response" in err) {
                const axiosError = err as {
                    response?: { data?: { message?: string; error?: string }; status?: number };
                };

                // HTTPステータスコードに基づいてエラーメッセージを設定
                if (axiosError.response?.status === 400) {
                    setError("入力内容に不備があります");
                } else if (axiosError.response?.status === 409) {
                    setError("このメールアドレスは既に使用されています");
                } else if (axiosError.response?.status === 422) {
                    setError("メールアドレスの形式が正しくありません");
                } else if (axiosError.response?.status === 500) {
                    setError("サーバーエラーが発生しました");
                } else {
                    const errorMessage =
                        axiosError.response?.data?.message ||
                        axiosError.response?.data?.error ||
                        "登録に失敗しました";
                    setError(errorMessage);
                }
            } else {
                setError("ネットワークエラーが発生しました");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.signinWrapper}>
            <form onSubmit={handleSubmit} className={styles.signinCard}>
                <h1 className={styles.signinTitle}>ユーザー登録</h1>

                {error && <p className={styles.signinError}>{error}</p>}

                <input
                    type="text"
                    placeholder="名前"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.signinInput}
                    disabled={loading}
                    required
                />

                <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.signinInput}
                    disabled={loading}
                    required
                />

                <input
                    type="password"
                    placeholder="パスワード（6文字以上）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.signinInput}
                    disabled={loading}
                    required
                    minLength={6}
                />

                <button type="submit" className={styles.signinButton} disabled={loading}>
                    {loading ? "登録中..." : "登録する"}
                </button>

                <div className={styles.linkContainer}>
                    <p className={styles.linkText}>
                        既にアカウントをお持ちの方は{" "}
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className={styles.linkButton}
                            disabled={loading}
                        >
                            ログイン
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
}
