"use client";

export const CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Outros",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Moradia: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Alimentação: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Transporte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Saúde: "bg-red-500/10 text-red-500 border-red-500/20",
  Lazer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Outros: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export const CATEGORY_DOT_COLORS: Record<string, string> = {
  Moradia: "bg-amber-500",
  Alimentação: "bg-orange-500",
  Transporte: "bg-blue-500",
  Saúde: "bg-red-500",
  Lazer: "bg-purple-500",
  Outros: "bg-zinc-500",
};
