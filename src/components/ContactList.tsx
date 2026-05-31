"use client";

import { useState, useMemo } from "react";
import {
  Contact,
  ContactWithCalculated,
  ConversationStatus,
  Priority,
  STATUS_COLORS,
  STATUS_BADGE_COLORS,
} from "@/lib/types";
import { computeCalculatedFields, daysUntilBgColor, formatDate } from "@/lib/utils";
import AddEditContactModal from "./AddEditContactModal";
import ContactDetailPanel from "./ContactDetailPanel";

interface Props {
  initialContacts: Contact[];
  username: string;
}

type SortField = "created_at" | "artist_band" | "last_contact_date" | "days_until_follow_up" | "priority";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<Priority | "null", number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  null: 3,
};

export default function ContactList({ initialContacts, username }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ConversationStatus | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inboundAddress = `${username}@wavelength-rts.com`;
  const selectedContact = selectedId ? contacts.find((c) => c.id === selectedId) ?? null : null;

  function copyAddress() {
    navigator.clipboard.writeText(inboundAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const computed = useMemo(() => contacts.map(computeCalculatedFields), [contacts]);

  const filtered = useMemo(() => {
    if (filterStatus === "All") return computed;
    return computed.filter((c) => c.conversation_status === filterStatus);
  }, [computed, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "artist_band") {
        cmp = a.artist_band.localeCompare(b.artist_band);
      } else if (sortField === "last_contact_date") {
        const ta = a.last_contact_date ? new Date(a.last_contact_date).getTime() : 0;
        const tb = b.last_contact_date ? new Date(b.last_contact_date).getTime() : 0;
        cmp = ta - tb;
      } else if (sortField === "days_until_follow_up") {
        const ta = a.days_until_follow_up ?? Infinity;
        const tb = b.days_until_follow_up ?? Infinity;
        cmp = ta - tb;
      } else if (sortField === "priority") {
        const pa = PRIORITY_ORDER[(a.priority ?? "null") as Priority | "null"];
        const pb = PRIORITY_ORDER[(b.priority ?? "null") as Priority | "null"];
        cmp = pa - pb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function handleContactSaved(contact: Contact) {
    setContacts((prev) => {
      const exists = prev.find((c) => c.id === contact.id);
      if (exists) return prev.map((c) => (c.id === contact.id ? contact : c));
      return [contact, ...prev];
    });
    setShowModal(false);
    setSelectedId(contact.id);
  }

  function handleContactUpdated(contact: Contact) {
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const statuses: ConversationStatus[] = [
    "New Reply (Needs Response)",
    "Replied (Waiting on Them)",
    "Ongoing Conversation",
    "Call Scheduled",
    "Had Call",
    "Follow-Up Needed",
    "Inactive",
  ];

  const panelOpen = !!selectedContact;

  return (
    <div>
      {/* Inbound address banner */}
      {username && (
        <div className="mb-5 flex items-center justify-between gap-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-indigo-600 font-medium mb-0.5">Your inbound address</p>
            <p className="text-sm font-mono text-indigo-900 truncate">{inboundAddress}</p>
            <p className="text-xs text-indigo-500 mt-0.5">BCC or forward to this address to automatically add a contact.</p>
          </div>
          <button
            onClick={copyAddress}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || filterStatus !== "All"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
            title="Filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add contact
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("All")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === "All"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split layout: list + panel */}
      <div className={`flex gap-4 items-start ${panelOpen ? "lg:flex-row" : ""}`}>
        {/* Contact table */}
        <div className={`min-w-0 ${panelOpen ? "hidden lg:block lg:flex-1" : "w-full"}`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_180px_90px_110px_100px] gap-0 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <button className="text-left hover:text-gray-900 flex items-center" onClick={() => toggleSort("artist_band")}>
                Artist / Band <SortIcon field="artist_band" />
              </button>
              <span>Status</span>
              <button className="text-left hover:text-gray-900 flex items-center" onClick={() => toggleSort("priority")}>
                Priority <SortIcon field="priority" />
              </button>
              <button className="text-left hover:text-gray-900 flex items-center" onClick={() => toggleSort("days_until_follow_up")}>
                Follow-Up <SortIcon field="days_until_follow_up" />
              </button>
              <button className="text-left hover:text-gray-900 flex items-center" onClick={() => toggleSort("last_contact_date")}>
                Last Contact <SortIcon field="last_contact_date" />
              </button>
            </div>

            {sorted.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">No contacts yet</p>
                <p className="text-xs text-gray-500 mt-1">Add your first contact to get started</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add contact
                </button>
              </div>
            ) : (
              sorted.map((contact, idx) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  isLast={idx === sorted.length - 1}
                  isSelected={contact.id === selectedId}
                  onClick={() => setSelectedId(contact.id === selectedId ? null : contact.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {panelOpen && selectedContact && (
          <div className="w-full lg:w-[460px] shrink-0 rounded-xl border border-gray-200 overflow-hidden sticky top-20 max-h-[calc(100vh-6rem)]">
            <ContactDetailPanel
              contact={selectedContact}
              onClose={() => setSelectedId(null)}
              onUpdated={handleContactUpdated}
            />
          </div>
        )}
      </div>

      {showModal && (
        <AddEditContactModal
          onClose={() => setShowModal(false)}
          onSaved={handleContactSaved}
        />
      )}
    </div>
  );
}

function ContactRow({
  contact,
  isLast,
  isSelected,
  onClick,
}: {
  contact: ContactWithCalculated;
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusClass = contact.conversation_status
    ? STATUS_COLORS[contact.conversation_status]
    : "bg-white";
  const statusBadgeClass = contact.conversation_status
    ? STATUS_BADGE_COLORS[contact.conversation_status]
    : "bg-gray-100 text-gray-500";

  const priorityColors: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[1fr_180px_90px_110px_100px] gap-0 px-4 py-3 cursor-pointer transition-colors ${statusClass} ${
        isSelected ? "ring-2 ring-inset ring-indigo-400" : "hover:brightness-95"
      } ${!isLast ? "border-b border-gray-100" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-gray-900 text-sm truncate">{contact.artist_band}</span>
        {contact.is_new && (
          <span className="shrink-0 text-xs font-semibold bg-emerald-500 text-white rounded-full px-1.5 py-0.5">NEW</span>
        )}
        {contact.contact_name && (
          <span className="text-xs text-gray-400 truncate hidden lg:block">{contact.contact_name}</span>
        )}
      </div>

      <div className="flex items-center">
        {contact.conversation_status ? (
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${statusBadgeClass} truncate`}>
            {contact.conversation_status}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>

      <div className="flex items-center">
        {contact.priority ? (
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${priorityColors[contact.priority] ?? "bg-gray-100 text-gray-600"}`}>
            {contact.priority}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>

      <div className="flex items-center">
        {contact.days_until_follow_up !== null ? (
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${daysUntilBgColor(contact.days_until_follow_up)}`}>
            {contact.days_until_follow_up === 0
              ? "Today"
              : contact.days_until_follow_up < 0
              ? `${Math.abs(contact.days_until_follow_up)}d overdue`
              : `${contact.days_until_follow_up}d`}
          </span>
        ) : contact.follow_up_in === "When they reach out" ? (
          <span className="text-xs text-gray-400">Waiting</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>

      <div className="flex items-center">
        <span className="text-xs text-gray-500">{formatDate(contact.last_contact_date)}</span>
      </div>
    </div>
  );
}
