'use client';

import { cn } from '@/lib/utils';

export default function NavigationBar({ children, className }) {
    return <div className={cn('navigation-bar', className)}>{children}</div>;
}
