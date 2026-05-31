"use client";

import { useState, useEffect } from "react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">{children}</div>
    </div>
  );
}

export function InlineText({
  label, value, placeholder, onSave, isLink,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  onSave: (v: string) => void;
  isLink?: boolean;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [editing, setEditing] = useState(false);
  useEffect(() => { setLocal(value ?? ""); }, [value]);

  if (editing) {
    return (
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
        <input
          autoFocus
          type={isLink ? "url" : "text"}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { setEditing(false); onSave(local); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") { setLocal(value ?? ""); setEditing(false); }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full flex items-center justify-between px-3 py-2 gap-3 hover:bg-white transition-colors text-left group rounded-xl"
    >
      <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
      <span className={`text-sm flex-1 text-right truncate ${local ? (isLink ? "text-indigo-600" : "text-gray-900") : "text-gray-400"}`}>
        {local || "—"}
      </span>
      <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

export function InlineDate({
  label, value, onSave,
}: {
  label: string;
  value: string | null | undefined;
  onSave: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onSave(e.target.value)}
        className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer text-right flex-1"
      />
    </div>
  );
}

export function InlineSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string | null | undefined;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="text-sm text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer text-right flex-1 min-w-0"
      >
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function ReadOnlyRow({
  label, value, badge,
}: {
  label: string;
  value: string | null;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
      {badge && value ? (
        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${badge}`}>{value}</span>
      ) : (
        <span className="text-sm text-gray-400 italic">{value ?? "—"}</span>
      )}
    </div>
  );
}

export function NoteField({
  label, value, placeholder, onBlur,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onBlur: (v: string) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => { setLocal(value ?? ""); }, [value]);

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
