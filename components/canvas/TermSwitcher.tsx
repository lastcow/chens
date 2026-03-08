"use client";
import { useTerm } from "./TermProvider";

export default function TermSwitcher() {
  const { terms, activeTerm, setActiveTerm } = useTerm();

  if (terms.length <= 1) {
    return activeTerm ? (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>
        {activeTerm.name}
      </div>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600">Term:</span>
      <div className="flex gap-1 flex-wrap">
        {terms.map(t => (
          <button
            key={t.canvas_id}
            onClick={() => setActiveTerm(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTerm?.canvas_id === t.canvas_id
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
            }`}
          >
            {t.name}
            {t.is_current && <span className="ml-1 text-green-600 text-xs">●</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
