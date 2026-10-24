"use client";
// components/NetworkSheet.tsx — واجهة تفاعلية شاملة لقوائم المتابِعين والمتابَعين مع بحث ومتابعة سريعة وعلامات التوثيق
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserCheck, UserPlus, Users, X, Sparkles } from "@/components/icons";
import { BottomSheet } from "@/components/ui";
import { VerifiedBadge } from "@/components/badges";
import { sb, uid, toast, explain, thumb, burst } from "@/lib/supabase";
import type { VerificationTier } from "@/types";

type UserItem = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified?: boolean;
  verification_tier?: VerificationTier | number | null;
  isFollowing?: boolean;
};

export function NetworkSheet({
  open,
  onClose,
  targetUserId,
  targetUserName = "المستخدم",
  initialTab = "followers",
  onCountChange,
}: {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
  initialTab?: "followers" | "following";
  onCountChange?: (delta: { followers?: number; following?: number }) => void;
}) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // تحديث التبويب عند الفتح
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // جلب المستخدم الحالي وقائمة من يتابعهم
  useEffect(() => {
    if (!open) return;
    uid().then(async (me) => {
      setCurrentUserId(me ?? null);
      if (me) {
        const { data } = await sb
          .from("follows")
          .select("following_id")
          .eq("follower_id", me)
          .eq("status", "accepted");
        setMyFollowingIds(new Set((data ?? []).map((x: any) => x.following_id as string)));
      }
    });
  }, [open]);

  // تحميل المتابعين ومن يتابعهم الحساب
  useEffect(() => {
    if (!open || !targetUserId) return;
    let cancelled = false;

    // يُجرَّب الاستعلام الكامل ثم نسخة بأعمدة أساسية إن فشل (عمود غير متاح)، وأي فشل نهائي يظهر للمستخدم مع إعادة محاولة
    const COLS = "id,username,display_name,avatar_url,bio,verified,verification_tier";
    const COLS_SAFE = "id,username,display_name,avatar_url,bio,verified";
    const side = (rel: "follower" | "following", cols: string) =>
      sb
        .from("follows")
        .select(`${rel}:profiles!${rel}_id(${cols})`)
        .eq(rel === "follower" ? "following_id" : "follower_id", targetUserId)
        .eq("status", "accepted")
        .limit(150);

    async function loadData() {
      setLoading(true);
      setFailed(false);
      try {
        let [fResp, gResp]: any[] = await Promise.all([side("follower", COLS), side("following", COLS)]);
        if (fResp.error || gResp.error) [fResp, gResp] = await Promise.all([side("follower", COLS_SAFE), side("following", COLS_SAFE)]);
        if (cancelled) return;
        if (fResp.error || gResp.error) throw fResp.error ?? gResp.error;

        setFollowers((fResp.data ?? []).map((r: any) => r.follower).filter(Boolean));
        setFollowing((gResp.data ?? []).map((r: any) => r.following).filter(Boolean));
      } catch (e) {
        console.error("[NetworkSheet]", e);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [open, targetUserId, tick]);

  // التبديل بين المتابعة وإلغاء المتابعة
  async function toggleFollow(user: UserItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentUserId) {
      toast("سجّل الدخول لمتابعة هذا الحساب", "info");
      return;
    }
    if (user.id === currentUserId) return;

    if (navigator.vibrate) navigator.vibrate(10);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);

    const isCurrentlyFollowing = myFollowingIds.has(user.id);
    const nextFollowing = !isCurrentlyFollowing;

    // تحديث متفائل فوري
    setMyFollowingIds((prev) => {
      const next = new Set(prev);
      if (nextFollowing) next.add(user.id);
      else next.delete(user.id);
      return next;
    });

    setActionBusy(user.id);
    try {
      const key = { follower_id: currentUserId, following_id: user.id };
      if (nextFollowing) {
        const { error } = await sb.from("follows").insert({ ...key, status: "accepted" });
        if (error) throw error;
        toast(`تابعتَ ${user.display_name ?? user.username}`, "success");
        if (targetUserId === currentUserId) onCountChange?.({ following: 1 });
      } else {
        const { error } = await sb.from("follows").delete().match(key);
        if (error) throw error;
        toast(`أُلغيت متابعة ${user.display_name ?? user.username}`, "info");
        if (targetUserId === currentUserId) onCountChange?.({ following: -1 });
      }
    } catch (err: any) {
      // تراجع عند الفشل
      setMyFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) next.add(user.id);
        else next.delete(user.id);
        return next;
      });
      toast("تعذّر تحديث حالة المتابعة", "error");
    } finally {
      setActionBusy(null);
    }
  }

  const currentList = tab === "followers" ? followers : following;
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(
      (u) =>
        (u.display_name ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.bio ?? "").toLowerCase().includes(q)
    );
  }, [currentList, query]);

  return (
    <BottomSheet open={open} onClose={onClose} title={`شبكة ${targetUserName}`}>
      <div className="flex flex-col gap-3 min-h-[360px] max-h-[75vh]">
        {/* تبويبات المتابعين / يتابعهم */}
        <div className="seg w-full">
          <button
            onClick={() => {
              setTab("followers");
              setQuery("");
            }}
            data-on={tab === "followers" ? "1" : undefined}
            className={`relative flex-1 py-2 font-bold text-sm ${tab === "followers" ? "text-charcoal" : "text-smoke"}`}
          >
            {tab === "followers" && (
              <motion.span
                layoutId="network-tab-pill"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="absolute inset-0 rounded-full bg-snow shadow-soft"
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              <span>المتابعون</span>
              <span className="tabular-nums text-xs px-2 py-0.5 rounded-full bg-mist text-graphite font-semibold">
                {followers.length}
              </span>
            </span>
          </button>

          <button
            onClick={() => {
              setTab("following");
              setQuery("");
            }}
            data-on={tab === "following" ? "1" : undefined}
            className={`relative flex-1 py-2 font-bold text-sm ${tab === "following" ? "text-charcoal" : "text-smoke"}`}
          >
            {tab === "following" && (
              <motion.span
                layoutId="network-tab-pill"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="absolute inset-0 rounded-full bg-snow shadow-soft"
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              <span>يتابعهم</span>
              <span className="tabular-nums text-xs px-2 py-0.5 rounded-full bg-mist text-graphite font-semibold">
                {following.length}
              </span>
            </span>
          </button>
        </div>

        {/* حقل البحث السريع */}
        <div className="relative">
          <Search size={17} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-smoke" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "followers" ? "ابحث بين المتابعين…" : "ابحث فيمن يتابعهم…"}
            className="field !min-h-10 !rounded-full ps-10 pe-9 text-sm bg-fog border-silver focus:bg-snow"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-smoke hover:text-charcoal"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* قائمة الحسابات */}
        <div className="flex-1 overflow-y-auto min-h-[220px] divide-y divide-silver/50 pb-4">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                  <div className="h-11 w-11 rounded-full bg-mist shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 w-28 rounded-full bg-mist" />
                    <div className="h-3 w-20 rounded-full bg-mist" />
                  </div>
                  <div className="h-8 w-16 rounded-full bg-mist shrink-0" />
                </div>
              ))}
            </div>
          ) : failed ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-graphite">
              <p className="font-semibold text-charcoal">تعذّر تحميل القائمة</p>
              <button type="button" onClick={() => setTick((t: number) => t + 1)} className="btn btn-primary">إعادة المحاولة</button>
            </div>
          ) : !filteredList.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-graphite gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand-ink mb-1">
                <Users size={24} />
              </span>
              <p className="font-semibold text-charcoal">
                {query ? "لا توجد نتائج مطابقة لبحثك" : tab === "followers" ? "لا يوجد متابعون بعد" : "لا يتابع أي حساب حتى الآن"}
              </p>
              <p className="text-xs text-smoke max-w-[280px]">
                {query
                  ? "جرّب كلمات أخرى للبحث"
                  : tab === "followers"
                  ? "بمجرد نشر برومبتات متميزة ومشاركتها سيبدأ المبدعون بمتابعة هذا الحساب."
                  : "استكشف أفكار المبدعين في المجتمع وتفاعل معهم لبناء شبكتك."}
              </p>
            </div>
          ) : (
            filteredList.map((user) => {
              const name = user.display_name || user.username || "مستخدم خيال";
              const isMe = currentUserId === user.id;
              const isFollowing = myFollowingIds.has(user.id);
              const busy = actionBusy === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-3 px-1 transition-colors hover:bg-mist/30"
                >
                  {/* الأفاتار مع رابط للملف */}
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={onClose}
                    className="avatar h-11 w-11 shrink-0 bg-brand-tint text-brand-ink text-sm font-bold shadow-soft transition-transform active:scale-90"
                    data-i={name.slice(0, 1)}
                  >
                    {user.avatar_url && (
                      <img
                        src={thumb(user.avatar_url, 400)}
                        alt={name}
                        className="h-full w-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </Link>

                  {/* اسم المستخدم والمعرّف وشارة التوثيق */}
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={onClose}
                    className="min-w-0 flex-1 flex flex-col"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-sm font-semibold text-charcoal hover:underline">
                        {name}
                      </span>
                      {user.verified && (
                        <VerifiedBadge
                          tier={user.verification_tier ?? 1}
                          size={16}
                          interactive={false}
                        />
                      )}
                    </div>
                    <span dir="ltr" className="truncate text-start text-xs text-smoke font-mono">
                      @{user.username || "user"}
                    </span>
                    {user.bio && (
                      <p className="line-clamp-1 text-xs text-graphite mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </Link>

                  {/* زر المتابعة التفاعلي */}
                  <div className="shrink-0">
                    {isMe ? (
                      <span className="chip !h-8 px-2.5 text-xs text-smoke font-semibold bg-mist">
                        أنت
                      </span>
                    ) : (
                      <button
                        onClick={(e) => toggleFollow(user, e)}
                        disabled={busy}
                        className={`btn !min-h-8 !px-3 !text-xs font-semibold rounded-full gap-1 shadow-sm transition-all duration-200 active:scale-95 ${
                          isFollowing
                            ? "bg-snow border-silver text-graphite hover:border-danger hover:text-danger hover:bg-danger-tint/20"
                            : "btn-primary !min-h-8"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck size={14} className="text-ok-ink" />
                            <span>أتابعه</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>متابعة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
