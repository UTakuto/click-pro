"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./Photos.module.css";

type Photo = {
    id: number;
    image_url: string;
    title: string;
    description: string;
    user: {
        name: string;
    };
};

export default function PhotosPage() {
    const router = useRouter();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
    const [imageLoadingStates, setImageLoadingStates] = useState<
        Map<number, "loading" | "loaded" | "error">
    >(new Map());

    useEffect(() => {
        // ログイン状態を確認
        const checkAuthStatus = async () => {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!token || !userId) {
                setIsLoggedIn(false);
                return;
            }

            try {
                // 既存のphotos APIでtoken有効性をチェック
                await api.get("/photos", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // API呼び出しが成功した場合、tokenは有効
                setIsLoggedIn(true);
            } catch (error) {
                console.error("Token verification failed:", error);
                // 認証エラーの場合はログアウト
                if (error && typeof error === "object" && "response" in error) {
                    const axiosError = error as {
                        response?: { status?: number };
                    };
                    if (axiosError.response?.status === 401) {
                        handleLogout();
                    } else {
                        // 401以外のエラー（ネットワークエラーなど）の場合は、
                        // tokenがあることを前提にログイン状態を維持
                        setIsLoggedIn(true);
                    }
                } else {
                    // その他のエラーの場合も、tokenがあることを前提にログイン状態を維持
                    setIsLoggedIn(true);
                }
            }
        };

        const handleLogout = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            setIsLoggedIn(false);
        };

        checkAuthStatus();

        // 定期的にtoken有効性をチェック（10分ごと）
        const authCheckInterval = setInterval(checkAuthStatus, 10 * 60 * 1000);

        const fetchPhotos = async () => {
            try {
                setLoading(true);
                const res = await api.get("/photos");
                setPhotos(res.data);
                setError("");
            } catch (err) {
                console.error("Photos fetch error:", err);
                if (err && typeof err === "object" && "response" in err) {
                    const axiosError = err as {
                        response?: { data?: { message?: string; error?: string }; status?: number };
                    };

                    if (axiosError.response?.status === 401) {
                        setError("認証が必要です。ログインしてください。");
                        // 認証エラーの場合はログアウト処理
                        localStorage.removeItem("token");
                        localStorage.removeItem("userId");
                        setIsLoggedIn(false);
                    } else if (axiosError.response?.status === 403) {
                        setError("アクセス権限がありません。");
                    } else {
                        const errorMessage =
                            axiosError.response?.data?.message ||
                            axiosError.response?.data?.error ||
                            "写真の取得に失敗しました";
                        setError(errorMessage);
                    }
                } else {
                    setError("ネットワークエラーが発生しました");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();

        // cleanup function
        return () => {
            clearInterval(authCheckInterval);
        };
    }, []);

    const handleImageError = (photoId: number) => {
        console.log(`Image load failed for photo ID: ${photoId}`);
        setImageErrors((prev) => {
            if (prev.has(photoId)) {
                return prev; // 既にエラー状態の場合は何もしない（無限ループ防止）
            }
            const newSet = new Set(prev);
            newSet.add(photoId);
            return newSet;
        });
        setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(photoId, "error");
            return newMap;
        });
    };

    const handleImageLoad = (photoId: number) => {
        setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(photoId, "loaded");
            return newMap;
        });
    };

    const handleImageLoadStart = (photoId: number) => {
        setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(photoId)) {
                newMap.set(photoId, "loading");
            }
            return newMap;
        });
    };

    const handlePhotoClick = (photoId: number) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoggedIn(false);
            router.push("/");
            return;
        }
        router.push(`/photos/${photoId}`);
    };

    return (
        <div className={styles.galleryWrapper}>
            <div className={styles.headerContainer}>
                <h1 className={styles.header}>投稿された写真</h1>
                {isLoggedIn ? (
                    <button className={styles.uploadButton} onClick={() => router.push("/upload")}>
                        ＋ 投稿
                    </button>
                ) : (
                    <button className={styles.uploadButton} onClick={() => router.push("/")}>
                        ログイン
                    </button>
                )}
            </div>

            {loading && <p>読み込み中...</p>}

            {error && <div className={styles.errorBox}>{error}</div>}

            {!loading && !error && photos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>投稿された写真がありません</p>
                </div>
            )}

            <div className={styles.photoGrid}>
                {photos.map((photo) => {
                    const loadingState = imageLoadingStates.get(photo.id);
                    const hasError = imageErrors.has(photo.id);

                    return (
                        <div
                            key={photo.id}
                            className={styles.photoCard}
                            onClick={() => handlePhotoClick(photo.id)}
                        >
                            {hasError ? (
                                <div className="w-full h-48 bg-gray-200 flex flex-col items-center justify-center">
                                    <div className="text-gray-400 mb-2">
                                        <svg
                                            width="40"
                                            height="40"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        画像を読み込めませんでした
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {loadingState === "loading" && (
                                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.image_url}
                                        alt={photo.title}
                                        className={styles.photoImage}
                                        style={{
                                            opacity: loadingState === "loading" ? 0.3 : 1,
                                        }}
                                        onLoad={() => handleImageLoad(photo.id)}
                                        onLoadStart={() => handleImageLoadStart(photo.id)}
                                        onError={() => handleImageError(photo.id)}
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className={styles.photoTextBox}>
                                <strong>{photo.title}</strong>
                                <p>
                                    <span className={styles.userName}>{photo.user.name}</span>
                                    {photo.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
