"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/route";
import styles from "./PhotoDetail.module.css";

type Photo = {
    id: number;
    image_url: string;
    title: string;
    description: string;
    user: {
        id: number;
        name: string;
    };
};

export default function PhotoDetail() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) setCurrentUserId(Number(userId));

        const fetchPhoto = async () => {
            try {
                const res = await api.get(`/photos/${params.id}`);
                setPhoto(res.data);
            } catch (err) {
                setError("取得できませんでした");
                console.log(err);
            }
        };
        fetchPhoto();
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm("本当に削除しますか？")) return;

        try {
            const token = localStorage.getItem("token");
            await api.delete(`/photos/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            router.push("/photos");
        } catch (err) {
            alert("削除に失敗しました");
            console.log(err);
        }
    };

    if (error) return <div className={styles.errorText}>{error}</div>;
    if (!photo) return <div className={styles.loadingText}>読み込み中...</div>;

    const isOwner = currentUserId === photo.user.id;

    return (
        <div className={styles.detailWrapper}>
            <button className={styles.backButton} onClick={() => router.push("/photos")}>
                <span className={styles.arrow}></span>
                戻る
            </button>

            <div className={styles.photoContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.title} className={styles.photoImage} />

                <div className={styles.photoInfo}>
                    <h1 className={styles.photoTitle}>{photo.title}</h1>
                    <p className={styles.photoDescription}>
                        <span className={styles.photoAuthor}>{photo.user.name}</span>
                        {photo.description}
                    </p>
                </div>
            </div>

            {isOwner && (
                <div className={styles.actionButtons}>
                    <button
                        className={styles.editButton}
                        onClick={() => router.push(`/photos/${photo.id}/edit`)}
                    >
                        編集
                    </button>
                    <button className={styles.deleteButton} onClick={handleDelete}>
                        削除
                    </button>
                </div>
            )}
        </div>
    );
}
