"use client";
import Link from "next/link";
import { useState } from "react";
import { Star, Loader2, BadgeCheck, Trash2 } from "lucide-react";
import { Stars } from "./Stars";
import { useToast } from "../Toaster";
import { formatDate } from "@/lib/utils";
import type { RatingSummary, Review } from "@/lib/repo/reviews";

interface Props { slug: string; initialReviews: Review[]; summary: RatingSummary; user: { id: number; verified: boolean } | null }

export function Reviews({ slug, initialReviews, summary: initialSummary, user }: Props) {
  const [reviews, setReviews] = useState(initialReviews); const [summary, setSummary] = useState(initialSummary);
  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  const [rating, setRating] = useState(mine?.rating ?? 5); const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(mine?.title ?? ""); const [body, setBody] = useState(mine?.body ?? "");
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const res = await fetch(`/api/products/${slug}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, title, body }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Could not save review", "error"); return; }
    setReviews(d.reviews); setSummary(d.summary); setOpen(false); toast(mine ? "Review updated" : "Thanks for your review!");
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) { const r = await fetch(`/api/products/${slug}/reviews`); const d = await r.json(); setReviews(d.reviews); setSummary(d.summary); toast("Review deleted"); }
  };

  return (
    <section className="mt-14" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
          {summary.count > 0 ? <p className="mt-1 flex items-center gap-2 text-sm text-gray-600"><Stars value={summary.avg} size="md" /><b className="text-ink">{summary.avg}</b> · {summary.count} review{summary.count === 1 ? "" : "s"}</p> : <p className="mt-1 text-sm text-gray-600">No reviews yet — be the first.</p>}
        </div>
        {user ? (user.verified ? <button onClick={() => setOpen((o) => !o)} className="btn-secondary">{mine ? "Edit your review" : "Write a review"}</button> : <Link href="/account/security" className="btn-secondary">Verify email to review</Link>) : <Link href={`/login?next=/shop/${slug}`} className="btn-secondary">Sign in to review</Link>}
      </div>
      {summary.count > 0 && (
        <div className="mt-4 grid max-w-sm gap-1 text-xs">{[5, 4, 3, 2, 1].map((n) => { const c = summary.dist[n as 5]; const pct = summary.count ? Math.round((c / summary.count) * 100) : 0; return (
          <div key={n} className="flex items-center gap-2"><span className="w-8 text-gray-600">{n}★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-amber-400" style={{ width: `${pct}%` }} /></div><span className="w-8 text-right text-gray-500">{c}</span></div>); })}</div>
      )}
      {open && (
        <form onSubmit={submit} className="card mt-5 max-w-2xl space-y-3 p-5">
          <div><label className="label">Your rating</label><div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} aria-label={`${i} stars`}><Star className={`h-7 w-7 transition ${i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} /></button>)}</div></div>
          <div><label className="label">Title <span className="text-gray-400">(optional)</span></label><input className="input" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sweet and perfectly ripe" /></div>
          <div><label className="label">Review</label><textarea className="input" rows={4} required minLength={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How was the taste, ripeness, packaging…?" /></div>
          <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{mine ? "Update review" : "Post review"}</button><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
        </form>
      )}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div><Stars value={r.rating} /><p className="mt-1 font-semibold">{r.title || `${r.rating}/5`}</p></div>
              {(user?.id === r.user_id) && <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-600" aria-label="Delete review"><Trash2 className="h-4 w-4" /></button>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{r.body}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">{r.user_name.split(" ")[0]} · {formatDate(r.created_at, { dateStyle: "medium" })}{r.verified_purchase ? <span className="inline-flex items-center gap-1 text-leaf-700"><BadgeCheck className="h-3.5 w-3.5" />Verified purchase</span> : null}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
