"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
export function Notice({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="dark-theme fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-white/15 bg-[#171717] p-8 text-white shadow-xl">
          <Dialog.Title className="pr-6 text-2xl font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-4 text-sm leading-7 text-neutral-400">
            {description}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button className="mt-6">Got it</Button>
          </Dialog.Close>
          <Dialog.Close
            className="absolute right-4 top-4 p-2"
            aria-label="Close"
          >
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
