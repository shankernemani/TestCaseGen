"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Plus, Heart } from "lucide-react";
import MentorAvatar from "./MentorAvatar";
import type { MentorId } from "@/lib/prompts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  task?: string | null;
  taskAdded?: boolean;
};

type Props = {
  mentorId: MentorId;
  mentorName: string;
  mentorRole: string;
  stage: string;
  category: string;
  initialMessages: { id: string; role: string; content: string }[];
};

/** Strip the machine-readable task marker from display text. */
function stripMarker(text: string): string {
  return text.replace(/\[\[task:\s*[^\]]*\]\]\s*$/i, "").trimEnd();
}

export default function ChatClient({ mentorId, mentorName, mentorRole, stage, category, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: stripMarker(m.content),
    }))
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showFamilyCard, setShowFamilyCard] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [messages.length]);

  // §2.3: close the session after 30 min idle (also fired on unmount).
  function armIdleTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => closeSession(), 30 * 60 * 1000);
  }

  function closeSession() {
    // fire-and-forget; keepalive survives page navigation
    fetch("/api/session/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId }),
      keepalive: true,
    }).catch(() => {});
  }

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);
    armIdleTimer();

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: text }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No reply");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const apply = (updater: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;
          let payload: { type: string; text?: string; task?: string | null; message?: string; sensitive?: boolean };
          try {
            payload = JSON.parse(line.slice(5));
          } catch {
            continue;
          }
          if (payload.type === "text" && payload.text) {
            apply((m) => ({ ...m, content: m.content + payload.text }));
          } else if (payload.type === "done") {
            if (payload.sensitive) setShowFamilyCard(true);
            apply((m) => ({ ...m, content: stripMarker(m.content), task: payload.task ?? null }));
          } else if (payload.type === "error") {
            apply((m) => ({ ...m, content: payload.message ?? "Something went wrong." }));
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? { ...m, content: err instanceof Error ? err.message : "Something went wrong — try again?" }
            : m
        )
      );
    } finally {
      setStreaming(false);
      armIdleTimer();
    }
  }

  // §3.2 suggested-task chip: one tap adds to roadmap.
  async function acceptTask(messageId: string, title: string) {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, taskAdded: true } : m)));
    await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, category, title }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-mist bg-white px-3 py-2">
        <Link href="/mentors" aria-label="Back to mentors" className="tap-target flex items-center justify-center text-ink/70" onClick={closeSession}>
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <MentorAvatar mentorId={mentorId} name={mentorName} size="sm" />
        <div>
          <div className="font-display font-semibold leading-tight">{mentorName}</div>
          <div className="text-xs text-ink/50">{mentorRole}</div>
        </div>
      </header>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="card mt-8 text-center">
            <p className="font-display text-lg">Say hello to {mentorName} 👋</p>
            <p className="mt-1 text-sm text-ink/60">
              First conversations are for getting to know each other.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <div
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-peacock px-4 py-2.5 text-white"
                  : "w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-mist bg-white px-4 py-2.5"
              }
            >
              {m.content || (
                <span className="inline-flex gap-1 py-1" aria-label={`${mentorName} is typing`}>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:240ms]" />
                </span>
              )}
            </div>
            {m.task && (
              <button
                type="button"
                disabled={m.taskAdded}
                onClick={() => acceptTask(m.id, m.task!)}
                className={`tap-target mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  m.taskAdded
                    ? "border-peacock bg-peacock-light text-peacock-dark"
                    : "border-marigold bg-marigold-light text-ink hover:border-peacock"
                }`}
              >
                <Plus size={15} aria-hidden />
                {m.taskAdded ? "Added to roadmap ✓" : `Add to roadmap: ${m.task}`}
              </button>
            )}
          </div>
        ))}
        {showFamilyCard && (
          <div className="card border-madder/40 bg-madder-light">
            <div className="flex items-center gap-2 font-display font-semibold text-madder">
              <Heart size={16} aria-hidden /> Talk to Amma/Appa?
            </div>
            <p className="mt-1 text-sm text-ink/70">
              Some things are best shared with family. They&apos;re on your side, always.
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer — paste-friendly for long drafts (§3.2) */}
      <form onSubmit={send} className="border-t border-mist bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={Math.min(6, Math.max(1, input.split("\n").length))}
            placeholder={`Message ${mentorName}…`}
            aria-label={`Message ${mentorName}`}
            className="max-h-40 flex-1 resize-none rounded-2xl border border-mist bg-jasmine px-4 py-2.5 text-[15px] focus:border-peacock"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-peacock text-white transition-colors hover:bg-peacock-dark disabled:opacity-40"
          >
            <ArrowUp size={20} aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
