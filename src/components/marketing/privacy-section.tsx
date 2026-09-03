import { ImageOff, Lock, Users } from "lucide-react";

const POINTS = [
  {
    icon: ImageOff,
    title: "Photos never stick around",
    body: "Your meal photo is analyzed in memory and discarded right after — only the calorie and macro numbers get saved. Nothing to store, nothing to leak.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your log is yours alone until you say otherwise. No public profiles, no feeds, no one browsing your history.",
  },
  {
    icon: Users,
    title: "Share on your terms",
    body: "Invite a coach, partner, or accountability buddy to view your log — they accept explicitly, get view-only access, and you can revoke it anytime.",
  },
] as const;

export function PrivacySection() {
  return (
    <section className="bg-element py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="max-w-lg font-display text-3xl font-semibold text-ink sm:text-4xl">
          Your log, your rules.
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] font-medium text-ink/85">
          Long-term tracking only works if it feels safe to be honest.
          Here&apos;s exactly what we do and don&apos;t do with your data.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title}>
              <point.icon className="size-7 text-ink" strokeWidth={2} />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {point.title}
              </h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/85">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
