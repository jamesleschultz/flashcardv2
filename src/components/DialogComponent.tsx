'use client'

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface DialogComponentProps {
  title: string;
  description: string;
  triggerText: string;
  children: ReactNode; // Content inside the dialog
}

export default function DialogComponent({
  title,
  description,
  triggerText,
  children,
}: DialogComponentProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}