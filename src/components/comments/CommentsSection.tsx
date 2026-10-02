"use client";

import { useState, useEffect, useTransition } from "react";
import { addComment, fetchComments, deleteComment } from "@/app/actions/comments";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Props {
  promptId: string;
  currentUserId?: string;
}

export function CommentsSection({ promptId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetchComments(promptId).then((res) => {
      setComments((res.comments as Comment[]) || []);
      setLoading(false);
    });
  }, [promptId]);

  const handleSubmit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addComment(promptId, body.trim());
      if (res.comment) {
        setComments((prev) => [...prev, res.comment as Comment]);
        setBody("");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteComment(id, promptId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gridline">
      <h3 className="text-15 font-medium text-ink">
        التعليقات ({comments.length})
      </h3>

      {loading ? (
        <p className="text-13 text-ash">جارٍ التحميل...</p>
      ) : comments.length === 0 ? (
        <p className="text-13 text-ash">لا توجد تعليقات بعد</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-vellum border border-gridline flex items-center justify-center text-13 text-graphite shrink-0">
                {c.user?.display_name?.[0] || c.user?.username?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-13 font-medium text-ink">
                    {c.user?.display_name || c.user?.username || "مستخدم"}
                  </span>
                  <span className="text-13 text-ash">
                    {new Date(c.created_at).toLocaleDateString("ar-SA")}
                  </span>
                  {currentUserId && c.user_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="mr-auto text-ash min-h-touch min-w-[32px] flex items-center justify-center"
                      aria-label="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-15 text-graphite leading-relaxed mt-0.5">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="أضف تعليقاً..."
          className="input-field flex-1"
          maxLength={1000}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
        />
        <Button
          onClick={handleSubmit}
          loading={pending}
          disabled={!body.trim()}
          size="sm"
        >
          إرسال
        </Button>
      </div>
    </div>
  );
}
