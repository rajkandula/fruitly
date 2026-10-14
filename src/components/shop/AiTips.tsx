"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function AiTips({ slug, name }: { slug: string; name: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [text, setText] = useState(""); const [model, setModel] = useState("");
  const ask = async () => {
    setState("busy");
    const res = await fetch("/api/ai/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    const data = await res.json();
    if (!res.ok) { setState("error"); return; }
    setText(data.output ?? ""); setModel(data.model ?? ""); setState("done");
  };
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-leaf-200 bg-leaf-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-peel-600" />Tips from our AI produce expert</h3><p className="text-xs text-gray-600">How to pick, store and enjoy {name} — powered by the Harakumo AI gateway.</p></div>
        {state !== "done" && <button onClick={ask} disabled={state === "busy"} className="btn-secondary btn-sm whitespace-nowrap">{state === "busy" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking…</> : "Ask"}</button>}
      </div>
      {state === "done" && <div className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{text}<p className="mt-2 text-[11px] text-gray-500">model: {model}</p></div>}
      {state === "error" && <p className="mt-2 text-sm text-red-600">The assistant is unavailable right now.</p>}
    </div>
  );
}
