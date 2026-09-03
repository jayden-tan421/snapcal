"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Eye, UserX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShareRow } from "@/lib/supabase/sharing-queries";
import {
  leaveShareAction,
  respondToInviteAction,
  revokeShareAction,
} from "@/lib/actions/sharing";

const STATUS_LABEL: Record<ShareRow["status"], string> = {
  pending: "Pending",
  accepted: "Active",
  declined: "Declined",
  revoked: "Revoked",
};

export function ShareList({
  rows,
  role,
}: {
  rows: ShareRow[];
  role: "owner" | "viewer";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string } | undefined>) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm font-medium text-ink-strong/50">
        {role === "owner"
          ? "You haven't shared your log with anyone yet."
          : "No one has shared their log with you yet."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-strong">
              {row.counterpart?.email ?? "Unknown user"}
            </p>
            <span
              className={cn(
                "text-xs font-medium",
                row.status === "accepted" && "text-element",
                row.status === "pending" && "text-ink-strong/50",
                (row.status === "declined" || row.status === "revoked") &&
                  "text-ink-strong/35"
              )}
            >
              {STATUS_LABEL[row.status]}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {role === "viewer" && row.status === "pending" && (
              <>
                <IconButton
                  label="Accept"
                  onClick={() =>
                    run(() => respondToInviteAction(row.id, true))
                  }
                  disabled={isPending}
                >
                  <Check className="size-4" />
                </IconButton>
                <IconButton
                  label="Decline"
                  onClick={() =>
                    run(() => respondToInviteAction(row.id, false))
                  }
                  disabled={isPending}
                  destructive
                >
                  <X className="size-4" />
                </IconButton>
              </>
            )}

            {role === "viewer" && row.status === "accepted" && (
              <>
                <Button asHref={`/shared/${row.counterpart?.id}`} label="View" />
                <IconButton
                  label="Leave"
                  onClick={() => run(() => leaveShareAction(row.id))}
                  disabled={isPending}
                  destructive
                >
                  <UserX className="size-4" />
                </IconButton>
              </>
            )}

            {role === "owner" &&
              (row.status === "pending" || row.status === "accepted") && (
                <IconButton
                  label="Revoke"
                  onClick={() => run(() => revokeShareAction(row.id))}
                  disabled={isPending}
                  destructive
                >
                  <UserX className="size-4" />
                </IconButton>
              )}
          </div>
        </li>
      ))}
    </ul>
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

function Button({ asHref, label }: { asHref: string; label: string }) {
  return (
    <Link
      href={asHref}
      title={label}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full text-ink-strong/40 hover:bg-element/10 hover:text-element"
    >
      <Eye className="size-4" />
    </Link>
  );
}
