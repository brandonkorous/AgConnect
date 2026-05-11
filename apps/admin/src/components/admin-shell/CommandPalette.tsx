'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBuilding, faHouse, faTurnDown } from '@fortawesome/free-solid-svg-icons';
import { NAV_ITEMS } from './nav-items';
import type { TenantOption } from './TenantSwitcher';

type Cmd =
  | { kind: 'nav'; id: string; label: string; href: string; hint: string }
  | { kind: 'tenant'; id: string; label: string; hint: string };

type Props = { tenants: TenantOption[] };

// Cmd/Ctrl+K opens the palette. "/" also opens it (skips when typing in an
// input). Enter activates the highlighted result; Esc closes.
export function CommandPalette({ tenants }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Detect tenant scope from URL so nav commands route correctly.
  const tenantPrefix = useMemo(() => {
    const m = pathname.match(/^(\/t\/[^/]+)(\/.*)?$/);
    return m?.[1] ?? '';
  }, [pathname]);
  const activeTenantId = useMemo(() => {
    const m = pathname.match(/^\/t\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);
  const subPath = useMemo(() => pathname.replace(/^\/t\/[^/]+/, '') || '/', [pathname]);

  const commands: Cmd[] = useMemo(() => {
    const navs: Cmd[] = NAV_ITEMS.filter((n) => {
      if (n.scope === 'both') return true;
      if (n.scope === 'platform') return tenantPrefix === '';
      return tenantPrefix !== '';
    }).map((n) => ({
      kind: 'nav',
      id: `nav:${n.href}`,
      label: n.label,
      href: tenantPrefix && n.scope !== 'platform' ? `${tenantPrefix}${n.href === '/' ? '' : n.href}` : n.href,
      hint: tenantPrefix && n.scope !== 'platform' ? 'tenant' : 'platform',
    }));

    const platformJump: Cmd[] =
      activeTenantId === null
        ? []
        : [
            {
              kind: 'tenant',
              id: 'tenant:platform',
              label: 'Switch to Platform',
              hint: 'global',
            },
          ];

    const tenantJumps: Cmd[] = tenants
      .filter((t) => t.id !== activeTenantId)
      .map((t) => ({
        kind: 'tenant' as const,
        id: `tenant:${t.id}`,
        label: `Jump to ${t.name}`,
        hint: 'tenant',
      }));

    return [...navs, ...platformJump, ...tenantJumps];
  }, [tenantPrefix, activeTenantId, tenants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Reset index when filter changes so the highlight is on a visible row.
  useEffect(() => {
    setIndex(0);
  }, [query, open]);

  // Global hotkeys.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open && e.key === '/' && !inField) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (open && e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
    else setQuery('');
  }, [open]);

  const activate = useCallback(
    (cmd: Cmd) => {
      if (cmd.kind === 'nav') {
        router.push(cmd.href);
      } else if (cmd.kind === 'tenant') {
        const id = cmd.id.slice('tenant:'.length);
        const target = id === 'platform' ? subPath : `/t/${id}${subPath === '/' ? '' : subPath}`;
        router.push(target);
      }
      setOpen(false);
    },
    [router, subPath],
  );

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[index];
      if (cmd) activate(cmd);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="btn btn-sm btn-ghost border-base-300 hover:bg-base-200 hidden gap-2 rounded-full border px-3 md:inline-flex"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5 opacity-70" />
        <span className="text-base-content/70 text-xs">Jump…</span>
        <kbd className="kbd kbd-xs">⌘K</kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="bg-base-100/40 fixed inset-0 z-50 flex items-start justify-center backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="bg-base-100 border-base-300 mt-[12vh] w-full max-w-xl overflow-hidden rounded-box border shadow-[var(--shadow-pop)]"
            onKeyDown={onListKey}
          >
            <div className="border-base-300 flex items-center gap-3 border-b px-4 py-3">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page or tenant…"
                className="w-full bg-transparent text-sm outline-none"
              />
              <kbd className="kbd kbd-xs">esc</kbd>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-1" role="listbox">
              {filtered.length === 0 ? (
                <li className="text-base-content/60 px-4 py-6 text-center text-sm">No matches</li>
              ) : (
                filtered.map((c, i) => (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={i === index}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => activate(c)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      i === index ? 'bg-base-200' : ''
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={c.kind === 'tenant' ? faBuilding : faHouse}
                      className="h-3.5 w-3.5 opacity-60"
                    />
                    <span className="flex-1 truncate">{c.label}</span>
                    <span className="text-base-content/40 text-[10px] uppercase tracking-wide">
                      {c.hint}
                    </span>
                    {i === index && (
                      <FontAwesomeIcon icon={faTurnDown} className="h-3 w-3 -rotate-90 opacity-50" />
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
