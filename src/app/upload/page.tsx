"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./UploadForm.module.css";

export default function UploadPage() {
    const router = useRouter();
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!image) {
            setError("画像を選択してください");
            return;
        }

        if (!title.trim()) {
            setError("タイトルを入力してください");
            return;
        }

        // ファイルサイズチェック（5MB制限）
        if (image.size > 5 * 1024 * 1024) {
            setError("ファイルサイズは5MB以下にしてください");
            return;
        }

        // ファイル形式チェック
        if (!image.type.startsWith("image/")) {
            setError("画像ファイルを選択してください");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);
        formData.append("title", title.trim());
        formData.append("description", description.trim());

        try {
            setUploading(true);
            await api.post("/photos", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            router.push("/photos");
        } catch (err) {
            console.error("Upload error:", err);

            // エラーレスポンスからメッセージを取得
            if (err instanceof Error) {
                setError(err.message || "投稿に失敗しました");
            } else if (err && typeof err === "object" && "response" in err) {
                const axiosError = err as {
                    response?: { data?: { message?: string; error?: string }; status?: number };
                };

                // HTTPステータスコードに基づいてエラーメッセージを設定
                if (axiosError.response?.status === 401) {
                    setError("認証が必要です。ログインしてください。");
                } else if (axiosError.response?.status === 403) {
                    setError("投稿する権限がありません。");
                } else if (axiosError.response?.status === 413) {
                    setError("ファイルサイズが大きすぎます。");
                } else if (axiosError.response?.status === 415) {
                    setError("サポートされていないファイル形式です。");
                } else if (axiosError.response?.status === 500) {
                    setError("サーバーエラーが発生しました。");
                } else {
                    const errorMessage =
                        axiosError.response?.data?.message ||
                        axiosError.response?.data?.error ||
                        "投稿に失敗しました";
                    setError(errorMessage);
                }
            } else {
                setError("ネットワークエラーが発生しました");
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.card}>
                <h1 className={styles.title}>📷 写真を投稿</h1>

                {error && <p className={styles.error}>{error}</p>}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.input}
                    disabled={uploading}
                    required
                />

                {image && (
                    <div className={styles.fileInfo}>
                        <p className={styles.fileName}>
                            選択されたファイル: {image.name} (
                            {(image.size / 1024 / 1024).toFixed(2)}MB)
                        </p>
                        {imagePreview && (
                            <div className={styles.previewContainer}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview}
                                    alt="プレビュー"
                                    className={styles.preview}
                                />
                            </div>
                        )}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    disabled={uploading}
                    required
                />

                <textarea
                    placeholder="説明"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                    disabled={uploading}
                />

                <button type="submit" className={styles.button} disabled={uploading}>
                    {uploading ? "アップロード中..." : "投稿する"}
                </button>
            </form>
        </div>
    );
}
