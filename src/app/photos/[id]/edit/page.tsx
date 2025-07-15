"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./EditPhoto.module.css";

export default function EditPhotoPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPhoto = async () => {
            try {
                const res = await api.get(`/photos/${params.id}`);
                setTitle(res.data.title);
                setDescription(res.data.description);
                setError("");
            } catch (err) {
                console.error("Photo fetch error:", err);
                setError("写真の取得に失敗しました");
            } finally {
                setLoading(false);
            }
        };

        fetchPhoto();
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("タイトルを入力してください");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await api.patch(
                `/photos/${params.id}`,
                { title: title.trim(), description: description.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            router.push(`/photos/`);
        } catch (err) {
            console.error("Update error:", err);
            setError("更新に失敗しました");
        }
    };

    if (loading) return <div className={styles.loadingText}>読み込み中...</div>;

    return (
        <div className={styles.editWrapper}>
            <button
                className={styles.backButton}
                onClick={() => router.push(`/photos/${params.id}`)}
            >
                <span className={styles.arrow}></span>
                戻る
            </button>

            <div className={styles.editCard}>
                <h1 className={styles.editTitle}>写真を編集</h1>

                {error && <div className={styles.errorText}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="タイトルを入力してください"
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>説明</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="写真の説明を入力してください"
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="submit" className={styles.updateButton}>
                            更新
                        </button>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => router.push(`/photos/`)}
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
