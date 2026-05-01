import * as React from 'react';
import { Button as RButton } from '@react-email/components';
import { colors, fonts } from './tokens';

type Props = {
  href: string;
  children: React.ReactNode;
};

export function Button({ href, children }: Props) {
  return (
    <RButton
      href={href}
      style={{
        backgroundColor: colors.moss,
        color: colors.bone,
        fontFamily: fonts.sans,
        fontSize: '15px',
        fontWeight: 600,
        lineHeight: 1,
        padding: '14px 22px',
        textDecoration: 'none',
        display: 'inline-block',
        border: 'none',
      }}
    >
      {children}
    </RButton>
  );
}
