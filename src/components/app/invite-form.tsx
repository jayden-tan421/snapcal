"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteViewerAction } from "@/lib/actions/sharing";
import { playSound } from "@/lib/sound";

export function InviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(inviteViewerAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      formRef.current?.reset();
      playSound("success");
    } else if (state.error) {
      playSound("error");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="email"
          type="email"
          required
          placeholder="their@email.com"
          className="h-10 flex-1 bg-ink/60"
        />
        <Button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-full bg-element px-4 text-sm font-semibold text-ink hover:bg-element/90"
        >
          {pending ? "Inviting…" : "Invite"}
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm font-medium text-element">Invite sent.</p>
      )}
    </form>
  );
}
