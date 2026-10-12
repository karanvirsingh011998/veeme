"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { CommunityPicker } from "@/components/dashboard/community/CommunityPicker";
import { formatPostedAt } from "@/lib/plans/service";
import {
  addMomentComment,
  createMoment,
  likedMomentIds,
  listMomentComments,
  listMoments,
  toggleMomentLike,
} from "@/lib/moments/service";
import type { Moment, MomentAudience, MomentComment } from "@/lib/moments/types";
import { useAppSelector } from "@/store/hooks";
import { selectOwnedCommunities } from "@/store/selectors/sharedSelectors";
import styles from "./moments.module.css";

/**
 * Photo-first moments feed with a composer for individual or community posts.
 */
export function MomentsScreen() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const authorName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.firstName ||
    "You";
  const initial = (authorName[0] || "V").toUpperCase();
  const owned = useAppSelector(selectOwnedCommunities);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLiked(likedMomentIds());
    void listMoments().then((items) => {
      if (cancelled) return;
      setMoments(items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onPosted(moment: Moment) {
    const match = owned.find((item) => item.id === moment.communityId);
    setMoments((current) => [
      { ...moment, communityName: moment.communityName || match?.name || null },
      ...current,
    ]);
    setOpen(false);
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>Moments</h1>
          <p>Photos, little updates and stories from your community.</p>
        </div>
        <button type="button" className={styles.post} onClick={() => setOpen(true)}>
          + Post
        </button>
      </header>

      <div className={styles.composerRow}>
        <span className={styles.avatar}>{initial}</span>
        <button type="button" className={styles.prompt} onClick={() => setOpen(true)}>
          Share a photo or a moment...
        </button>
        <button
          type="button"
          className={styles.photoBtn}
          aria-label="Add photo"
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="9" cy="10" r="1.4" fill="currentColor" />
            <path d="m7 16 3.2-3.2a1 1 0 0 1 1.4 0L16 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {loading ? <p className={styles.empty}>Loading moments…</p> : null}
      {!loading && moments.length === 0 ? (
        <p className={styles.empty}>No moments yet. Share a photo or a short update.</p>
      ) : null}

      <div className={styles.feed}>
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            liked={liked.includes(moment.id)}
            userId={userId}
            authorName={authorName}
            onLike={(id) => {
              const nowLiked = toggleMomentLike(id);
              setLiked((current) =>
                nowLiked ? [...current, id] : current.filter((item) => item !== id),
              );
            }}
          />
        ))}
      </div>

      {open ? (
        <Composer
          userId={userId}
          authorName={authorName}
          onClose={() => setOpen(false)}
          onPosted={onPosted}
        />
      ) : null}
    </div>
  );
}

function MomentCard({
  moment,
  liked,
  userId,
  authorName,
  onLike,
}: {
  moment: Moment;
  liked: boolean;
  userId: string;
  authorName: string;
  onLike: (id: string) => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [draft, setDraft] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const when = formatPostedAt(moment.createdAt);
  const context =
    moment.audience === "community"
      ? moment.communityName || "Community"
      : "Moment";

  useEffect(() => {
    if (!commentsOpen) return;
    let cancelled = false;
    void listMomentComments(moment.id).then((items) => {
      if (!cancelled) setComments(items);
    });
    return () => {
      cancelled = true;
    };
  }, [commentsOpen, moment.id]);

  async function onComment(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    const result = await addMomentComment({
      momentId: moment.id,
      authorId: userId,
      authorName,
      body: draft,
    });
    if (!result.ok) {
      setCommentError(result.error);
      return;
    }
    setComments((current) => [...current, result.comment]);
    setDraft("");
    setCommentError(null);
  }

  async function onShare() {
    const url = `${window.location.origin}/dashboard/moments`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote(url);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.smallAvatar}>
          {(moment.authorName[0] || "V").toUpperCase()}
        </span>
        <div>
          <p className={styles.name}>{moment.authorName}</p>
          <p className={styles.meta}>
            {when} · {context}
          </p>
        </div>
        {moment.audience === "community" ? (
          <span className={styles.badge}>COMMUNITY</span>
        ) : null}
      </div>
      {moment.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={moment.imageUrl} alt="" className={styles.photo} />
      ) : null}
      <div className={styles.cardBody}>
        <p>{moment.body}</p>
        <div className={styles.row}>
          <button
            type="button"
            className={`${styles.action} ${liked ? styles.actionLiked : ""}`}
            onClick={() => onLike(moment.id)}
          >
            {liked ? "♥" : "♡"} Like {moment.likeCount + (liked ? 1 : 0)}
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => setCommentsOpen((value) => !value)}
          >
            Comment{comments.length ? ` ${comments.length}` : ""}
          </button>
          <button type="button" className={`${styles.action} ${styles.share}`} onClick={() => void onShare()}>
            {shareNote || "Share"}
          </button>
        </div>
        {commentsOpen ? (
          <div className={styles.comments}>
            {comments.map((comment) => (
              <p key={comment.id} className={styles.comment}>
                <strong>{comment.authorName}</strong> <span>{comment.body}</span>
              </p>
            ))}
            <form className={styles.commentForm} onSubmit={(event) => void onComment(event)}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a comment"
                maxLength={300}
              />
              <button type="submit">Send</button>
            </form>
            {commentError ? <p className={styles.error}>{commentError}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Composer({
  userId,
  authorName,
  onClose,
  onPosted,
}: {
  userId: string;
  authorName: string;
  onClose: () => void;
  onPosted: (moment: Moment) => void;
}) {
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audience, setAudience] = useState<MomentAudience>("individual");
  const [communityId, setCommunityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("Sign in to share a moment.");
      return;
    }
    if (audience === "community" && !communityId) {
      setError("Choose one of your communities.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createMoment({
      authorId: userId,
      authorName,
      audience,
      communityId: audience === "community" ? communityId : null,
      body,
      imageUrl,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onPosted(result.moment);
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moment-composer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 id="moment-composer-title">Share a moment</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={(event) => void onSubmit(event)} className={styles.feed}>
          <label className={styles.field}>
            Moment
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={300}
              rows={3}
              placeholder="What's happening?"
            />
          </label>
          <label className={styles.field}>
            Photo link
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              type="url"
              placeholder="Optional photo URL (https://...)"
            />
          </label>
          <label className={styles.field}>
            Post to
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as MomentAudience)}
            >
              <option value="individual">Individual</option>
              <option value="community">Community</option>
            </select>
          </label>
          {audience === "community" ? (
            <CommunityPicker
              userId={userId}
              value={communityId}
              onChange={setCommunityId}
            />
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.submit} disabled={busy}>
            {busy ? "Posting…" : "Post moment"}
          </button>
        </form>
      </div>
    </div>
  );
}
