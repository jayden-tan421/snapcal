"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/lib/actions/account";
import { playSound } from "@/lib/sound";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    playSound("delete");
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) {
        toast.error("Couldn't delete your account", {
          description: result.error,
        });
        playSound("error");
      }
      // On success the action redirects, so there's nothing else to do here.
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-3xl bg-card p-5 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <span>
            <span className="block font-display text-base font-semibold text-destructive">
              Delete account
            </span>
            <span className="block text-sm font-medium text-ink-strong/60">
              Permanently erase your log and account
            </span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-ink-strong">
            Delete your account?
          </DialogTitle>
          <DialogDescription className="text-ink-strong/70">
            This permanently deletes your account, every meal you&apos;ve
            logged, and any sharing access you&apos;ve granted or been
            granted. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete">
            Type <span className="font-semibold">{CONFIRM_WORD}</span> to
            confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            className="h-10 bg-ink/60"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={confirmText !== CONFIRM_WORD || isPending}
            onClick={handleDelete}
            className="h-10 rounded-full bg-destructive text-ink hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
