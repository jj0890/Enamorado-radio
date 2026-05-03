import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Plus, X, PenLine } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PITCH_CATEGORIES = [
  { value: "interview", label: "Interview" },
  { value: "feature", label: "Feature" },
  { value: "review", label: "Review" },
  { value: "essay", label: "Essay" },
  { value: "column", label: "Column" },
  { value: "news", label: "News" },
  { value: "other", label: "Other" },
];

// ─── Form State ───────────────────────────────────────────────────────────────

type FormState = {
  // Writer
  writerName: string;
  writerEmail: string;
  writerBio: string;
  portfolioLinks: string[];
  twitterHandle: string;
  instagramHandle: string;
  // Pitch
  pitchTitle: string;
  pitchCategory: string;
  pitchSummary: string;
  whyThisPublication: string;
  uniqueAngle: string;
  // Writing sample
  writingSampleText: string;
  // Metadata
  exclusiveSubmission: boolean;
  previouslyPublished: boolean;
};

const EMPTY_FORM: FormState = {
  writerName: "",
  writerEmail: "",
  writerBio: "",
  portfolioLinks: [""],
  twitterHandle: "",
  instagramHandle: "",
  pitchTitle: "",
  pitchCategory: "",
  pitchSummary: "",
  whyThisPublication: "",
  uniqueAngle: "",
  writingSampleText: "",
  exclusiveSubmission: false,
  previouslyPublished: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPayload(form: FormState) {
  const portfolioLinks = form.portfolioLinks.filter((l) => l.trim().length > 0);
  const socialLinks: { twitter?: string; instagram?: string } = {};
  if (form.twitterHandle.trim()) socialLinks.twitter = form.twitterHandle.trim();
  if (form.instagramHandle.trim()) socialLinks.instagram = form.instagramHandle.trim();

  const wordCount = form.writingSampleText
    ? form.writingSampleText.trim().split(/\s+/).filter(Boolean).length
    : undefined;

  return {
    writerName: form.writerName.trim(),
    writerEmail: form.writerEmail.trim(),
    writerBio: form.writerBio.trim() || undefined,
    portfolioLinks: portfolioLinks.length > 0 ? portfolioLinks : undefined,
    socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    pitchTitle: form.pitchTitle.trim(),
    pitchCategory: form.pitchCategory || undefined,
    pitchSummary: form.pitchSummary.trim(),
    whyThisPublication: form.whyThisPublication.trim() || undefined,
    uniqueAngle: form.uniqueAngle.trim() || undefined,
    writingSampleText: form.writingSampleText.trim() || undefined,
    wordCount,
    exclusiveSubmission: form.exclusiveSubmission,
    previouslyPublished: form.previouslyPublished,
  };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-200 pt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">{label}</p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-xs text-gray-500 mt-0.5 mb-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WriterSubmissionPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const set = (key: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof buildPayload>) => {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Submission failed");
      return json;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.writerName.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!form.writerEmail.trim()) return toast({ title: "Email is required", variant: "destructive" });
    if (!form.pitchTitle.trim()) return toast({ title: "Pitch title is required", variant: "destructive" });
    if (form.pitchSummary.trim().length < 50)
      return toast({ title: "Pitch summary must be at least 50 characters", variant: "destructive" });
    mutation.mutate(buildPayload(form));
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center px-6 py-24">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Pitch received.</h1>
          <p className="text-gray-600 mb-2">
            Thanks for pitching to Enamorado Radio. We read every submission and will be in touch if
            it's a fit.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You'll hear back within 2–4 weeks. In the meantime, feel free to explore our archive.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/editorial">Read the magazine</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Enamorado Radio
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <PenLine className="w-4 h-4" />
            Write for us
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        {/* Intro */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Pitch to Enamorado Radio</h1>
          <p className="text-gray-600 leading-relaxed">
            We publish writing about electronic music, club culture, sound, and the communities
            around them. We're looking for pitches that have a clear perspective and bring something
            new to the conversation — interviews, essays, features, reviews, and columns.
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* ── About you ── */}
          <Section label="About you">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field id="writerName" label="Name" required>
                <Input
                  id="writerName"
                  value={form.writerName}
                  onChange={(e) => set("writerName", e.target.value)}
                  placeholder="Your full name"
                />
              </Field>
              <Field id="writerEmail" label="Email" required>
                <Input
                  id="writerEmail"
                  type="email"
                  value={form.writerEmail}
                  onChange={(e) => set("writerEmail", e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            </div>

            <Field
              id="writerBio"
              label="Short bio"
              hint="2–3 sentences. Tell us who you are and what you write about."
            >
              <Textarea
                id="writerBio"
                value={form.writerBio}
                onChange={(e) => set("writerBio", e.target.value)}
                className="h-24 resize-none"
                placeholder="I'm a music journalist based in…"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.writerBio.length}/500</p>
            </Field>

            {/* Portfolio links */}
            <Field
              id="portfolio-0"
              label="Portfolio links"
              hint="Links to published work (up to 5)."
            >
              <div className="space-y-2">
                {form.portfolioLinks.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      id={`portfolio-${i}`}
                      value={link}
                      onChange={(e) => {
                        const next = [...form.portfolioLinks];
                        next[i] = e.target.value;
                        set("portfolioLinks", next);
                      }}
                      placeholder="https://…"
                      className="flex-1"
                    />
                    {form.portfolioLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "portfolioLinks",
                            form.portfolioLinks.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {form.portfolioLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={() => set("portfolioLinks", [...form.portfolioLinks, ""])}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add another link
                  </button>
                )}
              </div>
            </Field>

            {/* Socials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field id="twitterHandle" label="Twitter / X" hint="Handle without @">
                <Input
                  id="twitterHandle"
                  value={form.twitterHandle}
                  onChange={(e) => set("twitterHandle", e.target.value)}
                  placeholder="yourhandle"
                />
              </Field>
              <Field id="instagramHandle" label="Instagram" hint="Handle without @">
                <Input
                  id="instagramHandle"
                  value={form.instagramHandle}
                  onChange={(e) => set("instagramHandle", e.target.value)}
                  placeholder="yourhandle"
                />
              </Field>
            </div>
          </Section>

          {/* ── Your pitch ── */}
          <Section label="Your pitch">
            <Field id="pitchTitle" label="Pitch title" required hint="A working title is fine — it can change.">
              <Input
                id="pitchTitle"
                value={form.pitchTitle}
                onChange={(e) => set("pitchTitle", e.target.value)}
                placeholder="e.g. The Invisible Architecture of Berlin's Techno Scene"
              />
            </Field>

            <Field id="pitchCategory" label="Type of piece">
              <Select
                value={form.pitchCategory}
                onValueChange={(v) => set("pitchCategory", v)}
              >
                <SelectTrigger id="pitchCategory">
                  <SelectValue placeholder="Select a type…" />
                </SelectTrigger>
                <SelectContent>
                  {PITCH_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="pitchSummary"
              label="Summary"
              required
              hint="At least 50 characters. What's the piece about? What will readers take away?"
            >
              <Textarea
                id="pitchSummary"
                value={form.pitchSummary}
                onChange={(e) => set("pitchSummary", e.target.value)}
                className="h-32 resize-none"
                placeholder="Describe your piece in 2–5 sentences…"
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                <span
                  className={`text-xs ${
                    form.pitchSummary.length < 50 && form.pitchSummary.length > 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {form.pitchSummary.length < 50
                    ? `${50 - form.pitchSummary.length} more characters needed`
                    : ""}
                </span>
                <span className="text-xs text-gray-400">{form.pitchSummary.length}/1000</span>
              </div>
            </Field>

            <Field
              id="whyThisPublication"
              label="Why Enamorado Radio?"
              hint="Optional but helpful. Why is this piece right for us specifically?"
            >
              <Textarea
                id="whyThisPublication"
                value={form.whyThisPublication}
                onChange={(e) => set("whyThisPublication", e.target.value)}
                className="h-24 resize-none"
                placeholder="This piece fits Enamorado because…"
                maxLength={500}
              />
            </Field>

            <Field
              id="uniqueAngle"
              label="Unique angle"
              hint="What makes this piece stand out? What's your specific perspective?"
            >
              <Textarea
                id="uniqueAngle"
                value={form.uniqueAngle}
                onChange={(e) => set("uniqueAngle", e.target.value)}
                className="h-20 resize-none"
                placeholder="My angle is…"
              />
            </Field>
          </Section>

          {/* ── Writing sample ── */}
          <Section label="Writing sample">
            <Field
              id="writingSampleText"
              label="Sample writing"
              hint="Paste up to 500 words of a recent piece — published or unpublished. Or link to your portfolio above."
            >
              <Textarea
                id="writingSampleText"
                value={form.writingSampleText}
                onChange={(e) => set("writingSampleText", e.target.value)}
                className="h-48 resize-none font-serif text-sm leading-relaxed"
                placeholder="Paste a sample of your writing here…"
              />
              {form.writingSampleText && (
                <p className="text-xs text-gray-400 mt-1">
                  {form.writingSampleText.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </Field>
          </Section>

          {/* ── Submission details ── */}
          <Section label="Submission details">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="exclusiveSubmission"
                  checked={form.exclusiveSubmission}
                  onCheckedChange={(checked) => set("exclusiveSubmission", !!checked)}
                  className="mt-0.5"
                />
                <div>
                  <label
                    htmlFor="exclusiveSubmission"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    Exclusive submission
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This pitch is being submitted exclusively to Enamorado Radio and is not under
                    consideration elsewhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="previouslyPublished"
                  checked={form.previouslyPublished}
                  onCheckedChange={(checked) => set("previouslyPublished", !!checked)}
                  className="mt-0.5"
                />
                <div>
                  <label
                    htmlFor="previouslyPublished"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    Previously published
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    A version of this piece has been published elsewhere before.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Submit ── */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-xs text-gray-400 max-w-xs">
              We aim to respond within 2–4 weeks. Only pitches that are a strong fit will receive a
              reply.
            </p>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-w-[140px]"
              size="lg"
            >
              {mutation.isPending ? "Sending…" : "Submit pitch"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
