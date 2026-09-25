import { useState } from "react";
import { X, Send, FileText, Music, Image as ImageIcon, Link as LinkIcon, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ProgressiveSubmissionFormProps {
  onClose: () => void;
  initialKind?: "writing" | "art" | "playlist" | "link";
}

const KINDS = [
  { id: "writing", label: "Writing", icon: FileText, description: "Essays, poetry, interviews" },
  { id: "art", label: "Visual Work", icon: ImageIcon, description: "Photography, illustration" },
  { id: "playlist", label: "Music", icon: Music, description: "Playlists, tracks, mixes" },
  { id: "link", label: "Link / Embed", icon: LinkIcon, description: "Substack, Spotify, YouTube" },
] as const;

export default function ProgressiveSubmissionForm({ onClose, initialKind }: ProgressiveSubmissionFormProps) {
  const [step, setStep] = useState<"kind" | "details" | "done">(initialKind ? "details" : "kind");
  const [kind, setKind] = useState<string>(initialKind ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Next Sunday as the concrete review date shown to submitters
  const nextSunday = (() => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  })();

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/community-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, description, externalUrl: url, authorName: name }),
      });
      if (!res.ok) throw new Error("Non-2xx response");
      setStep("done");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Submit Your Work</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Pick a kind */}
          {step === "kind" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">What are you submitting?</p>
              {KINDS.map(k => {
                const Icon = k.icon;
                return (
                  <button
                    key={k.id}
                    onClick={() => { setKind(k.id); setStep("details"); }}
                    className="w-full flex items-center gap-4 p-4 border rounded-lg hover:border-[var(--editorial)] hover:bg-[var(--editorial)]/5 transition-all text-left"
                  >
                    <Icon className="w-6 h-6 text-[var(--editorial)] shrink-0" />
                    <div>
                      <div className="font-medium">{k.label}</div>
                      <div className="text-sm text-gray-500">{k.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">{kind}</Badge>
                {!initialKind && (
                  <button onClick={() => setStep("kind")} className="text-xs text-gray-400 hover:text-gray-600 underline">
                    Change
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title of your work" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name / Handle</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="How should we credit you?" />
              </div>

              {(kind === "link" || kind === "playlist") && (
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us about your work…"
                  rows={4}
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title || submitting}
                  className="flex-1 bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Submitted!</h3>
              <p className="text-gray-600 text-sm mb-1">
                We review all submissions every Sunday.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Next review: <span className="font-medium text-gray-600">{nextSunday}</span>.
                If selected, we'll reach out directly.
              </p>

              {/* Show them what they're aiming for */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                  What happens if you're selected?
                </p>
                <p className="text-sm text-neutral-600">
                  Stand-out submissions become a{" "}
                  <a
                    href="/spotlight"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-neutral-800 hover:text-black"
                  >
                    Spotlight feature
                  </a>{" "}
                  — a short interview published on Enamorado with your work and your
                  story. See who's been featured before applying again.
                </p>
              </div>

              <Button
                onClick={onClose}
                className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white w-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
