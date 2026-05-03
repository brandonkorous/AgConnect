'use client';

import { useCallback, useRef, useState } from 'react';
import type { AddressValue } from '@agconn/ui';
import { AddressPinDrop } from './AddressPinDrop';

type Resolver = (value: AddressValue | null) => void;

export function useAddressPinDropFallback(initialCenter?: [number, number]) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<Resolver | null>(null);

  const request = useCallback(() => {
    setOpen(true);
    return new Promise<AddressValue | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((value: AddressValue | null) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const modal = (
    <AddressPinDrop
      open={open}
      initialCenter={initialCenter}
      onConfirm={(addr) => close(addr)}
      onCancel={() => close(null)}
    />
  );

  return { request, modal };
}
