"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { MENTOR_BG, MENTOR_BG_SOFT } from "./mentorColors";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatClient({
  mentorId,
  mentorName,
  color,
  opener,
  initialMessages,
}: {
  mentorId: string;
  mentorName: string;
  color: string;
  opener: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  // busy guards the whole request; streamStarted controls the indicator.
  const [busy, setBusy] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only follow the stream if she hasn't scrolled up to reread something.
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Note: no pagehide/unload close beacon on purpose — pagehide fires on
  // reloads (which would summarize a LIVE session mid-conversation) but not
  // on mobile PWA backgrounding, so the idle sweep is strictly better. The
  // /api/chat/close endpoint remains for a future explicit "end session" UI.

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    setStreamStarted(false);

    // On failure: remove the optimistic bubble and give her the text back.
    const rollback = () => {
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        setError(data.error ?? "Something went wrong.");
        rollback();
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setError("Something went wrong.");
        rollback();
        return;
      }
      // Stream the reply into a growing assistant bubble.
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!started) {
          started = true;
          setStreamStarted(true);
          setMessages((m) => [...m, { role: "assistant", content: acc }]);
        } else {
          const snapshot = acc;
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: "assistant", content: snapshot },
          ]);
        }
      }
      if (!started) {
        // The server already persisted her message at this point, so do NOT
        // roll back (resending would duplicate the turn) — just say so.
        setError(`${mentorName} didn't reply — send a follow-up message.`);
      }
    } catch {
      // Mid-stream drop: the server persists what the mentor said, so keep
      // any partial bubble; only roll back if nothing arrived at all.
      setError("Network problem — the reply may be incomplete.");
    } finally {
      setBusy(false);
      setStreamStarted(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-3"
      >
        {messages.length === 0 && (
          <div className={`rounded-2xl rounded-tl-sm ${MENTOR_BG_SOFT[color]} p-3 text-sm leading-relaxed`}>
            {opener}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-peacock px-3.5 py-2.5 text-sm leading-relaxed text-silk-50">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm ${MENTOR_BG_SOFT[color]} px-3.5 py-2.5 text-sm leading-relaxed`}
              >
                {m.content}
              </div>
            </div>
          ),
        )}
        {busy && !streamStarted && (
          <div className="flex items-center gap-2 pl-1 text-sm text-ink-faint">
            <span
              className={`h-2 w-2 animate-pulse rounded-full ${MENTOR_BG[color]}`}
            />
            {mentorName} is thinking…
          </div>
        )}
        {error && <p className="text-center text-xs text-madder">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="sticky bottom-0 flex items-end gap-2 border-t border-silk-200 bg-silk-50 px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={`Message ${mentorName}…`}
          className="input max-h-32 min-h-[46px] flex-1 resize-none py-2.5"
        />
        <button
          type="submit"
          disabled={busy || input.trim() === ""}
          aria-label="Send"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-silk-50 disabled:opacity-40 ${MENTOR_BG[color]}`}
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
