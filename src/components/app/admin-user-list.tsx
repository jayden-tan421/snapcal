"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminDeleteUserAction, adminSetAdminAction } from "@/lib/actions/admin";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const CONFIRM_WORD = "DELETE";

export interface AdminUserRow {
  id: string;
  email: string;
  daily_calorie_goal: number;
  is_admin: boolean;
  created_at: string;
}

export function AdminUserList({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q));
  }, [users, query]);

  function closeDeleteDialog() {
    setDeleteTarget(null);
    setConfirmText("");
  }

  function toggleAdmin(userRow: AdminUserRow) {
    startTransition(async () => {
      const result = await adminSetAdminAction(userRow.id, !userRow.is_admin);
      if (result?.error) {
        toast.error(result.error);
        playSound("error");
        return;
      }
      playSound("success");
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    playSound("delete");
    startTransition(async () => {
      const result = await adminDeleteUserAction(target.id);
      if (result?.error) {
        toast.error(result.error);
        playSound("error");
        return;
      }
      toast.success(`${target.email} deleted.`);
      closeDeleteDialog();
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-strong/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          aria-label="Search users by email"
          className="h-10 w-full rounded-full bg-ink/60 pr-9 pl-10 text-sm text-ink-strong outline-none placeholder:text-ink-strong/40 focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-strong/40 hover:bg-ink-strong/10 hover:text-ink-strong"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {query && (
        <p className="mb-2 text-xs font-medium text-ink-strong/45">
          {filteredUsers.length} of {users.length} user
          {users.length === 1 ? "" : "s"}
        </p>
      )}

      {filteredUsers.length === 0 ? (
        <p className="text-sm font-medium text-ink-strong/50">
          No users match &quot;{query}&quot;.
        </p>
      ) : (
      <ul className="flex flex-col gap-2">
        {filteredUsers.map((userRow) => (
          <li
            key={userRow.id}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-strong">
                {userRow.email}
                {userRow.id === currentUserId && (
                  <span className="ml-1.5 text-xs font-medium text-ink-strong/40">
                    (you)
                  </span>
                )}
                {userRow.is_admin && (
                  <span className="ml-1.5 rounded-full bg-element/15 px-2 py-0.5 text-[0.65rem] font-semibold text-element">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs font-medium text-ink-strong/50">
                Joined {new Date(userRow.created_at).toLocaleDateString()} · Goal{" "}
                {userRow.daily_calorie_goal} kcal
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <IconButton
                label={userRow.is_admin ? "Remove admin access" : "Make admin"}
                onClick={() => toggleAdmin(userRow)}
                disabled={
                  isPending || (userRow.id === currentUserId && userRow.is_admin)
                }
              >
                {userRow.is_admin ? (
                  <ShieldOff className="size-4" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
              </IconButton>
              <IconButton
                label="Delete user"
                onClick={() => setDeleteTarget(userRow)}
                disabled={isPending || userRow.id === currentUserId}
                destructive
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-ink-strong">
              Delete {deleteTarget?.email}?
            </DialogTitle>
            <DialogDescription className="text-ink-strong/70">
              This permanently deletes their account, every meal they&apos;ve
              logged, and any sharing access involving them. This can&apos;t
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete-user">
              Type <span className="font-semibold">{CONFIRM_WORD}</span> to
              confirm
            </Label>
            <Input
              id="confirm-delete-user"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              className="h-10 bg-ink/60"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 rounded-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={confirmText !== CONFIRM_WORD || isPending}
              onClick={confirmDelete}
              className="h-10 rounded-full bg-destructive text-ink hover:bg-destructive/90"
            >
              {isPending ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-40",
        destructive
          ? "text-ink-strong/40 hover:bg-destructive/10 hover:text-destructive"
          : "text-ink-strong/40 hover:bg-element/10 hover:text-element"
      )}
    >
      {children}
    </button>
  );
}
