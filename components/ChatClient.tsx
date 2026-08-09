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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-3">
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
        {busy && (
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
