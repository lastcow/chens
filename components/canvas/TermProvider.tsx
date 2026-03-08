"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Term { id: number; canvas_id: number; name: string; is_current: boolean; }

interface TermCtx {
  terms: Term[];
  activeTerm: Term | null;
  setActiveTerm: (t: Term) => void;
  termParam: string; // ready-to-append ?term_id=X
}

const Ctx = createContext<TermCtx>({ terms: [], activeTerm: null, setActiveTerm: () => {}, termParam: "" });

export function useTerm() { return useContext(Ctx); }

const STORAGE_KEY = "canvas_active_term_id";

export function TermProvider({ children }: { children: ReactNode }) {
  const [terms, setTerms]           = useState<Term[]>([]);
  const [activeTerm, setActiveTermState] = useState<Term | null>(null);

  useEffect(() => {
    fetch("/api/professor/terms")
      .then(r => r.json())
      .then(d => {
        const list: Term[] = d.terms ?? [];
        setTerms(list);
        // Try to restore from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedTerm = saved ? list.find(t => t.canvas_id === parseInt(saved)) : null;
        const current   = list.find(t => t.is_current) ?? list[0] ?? null;
        setActiveTermState(savedTerm ?? current);
      })
      .catch(() => {});
  }, []);

  const setActiveTerm = (t: Term) => {
    localStorage.setItem(STORAGE_KEY, String(t.canvas_id));
    setActiveTermState(t);
  };

  const termParam = activeTerm ? `term_id=${activeTerm.canvas_id}` : "";

  return (
    <Ctx.Provider value={{ terms, activeTerm, setActiveTerm, termParam }}>
      {children}
    </Ctx.Provider>
  );
}
