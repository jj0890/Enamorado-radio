const WEBHOOK_URL = process.env.DISCORD_EDITORIAL_WEBHOOK ?? "";

type Color = number;
const COLORS: Record<string, Color> = {
  planning:    0x6b7280, // gray
  "in-progress": 0xf59e0b, // amber
  "copy-edit": 0xf97316, // orange
  ready:       0x3b82f6, // blue
  published:   0x22c55e, // green
  featured:    0xa855f7, // purple
  uploaded:    0x06b6d4, // cyan
  error:       0xef4444, // red
};

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface NotifyOptions {
  title: string;
  description?: string;
  color?: string;
  fields?: EmbedField[];
  url?: string;
}

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  if (!WEBHOOK_URL) return; // silently skip if not configured

  const embed = {
    title:       opts.title,
    description: opts.description,
    color:       COLORS[opts.color ?? ""] ?? 0x4e5058,
    fields:      opts.fields ?? [],
    timestamp:   new Date().toISOString(),
    footer:      { text: "Enamorado Radio · Editorial" },
    ...(opts.url ? { url: opts.url } : {}),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // Notifications are fire-and-forget — never crash the request
  }
}

// ─── Convenience helpers ────────────────────────────────────────────────────

export function notifyStatusChange(
  projectTitle: string,
  newStatus: string,
  changedBy: string,
  projectId?: number
) {
  return notifyDiscord({
    title:       `Status → ${newStatus}`,
    description: `**${projectTitle}** moved to **${newStatus}**`,
    color:       newStatus,
    fields:      [{ name: "Changed by", value: changedBy, inline: true }],
    ...(projectId ? { url: `${process.env.SITE_URL ?? ""}/admin/editorial/${projectId}` } : {}),
  });
}

export function notifyMediaUpload(
  projectTitle: string,
  filename: string,
  uploadedBy: string
) {
  return notifyDiscord({
    title:       "Media uploaded",
    description: `**${filename}** added to **${projectTitle}**`,
    color:       "uploaded",
    fields:      [{ name: "Uploaded by", value: uploadedBy, inline: true }],
  });
}

export function notifyScheduledPublish(projectTitle: string, projectId: number) {
  return notifyDiscord({
    title:       "Scheduled publish fired",
    description: `**${projectTitle}** is now live`,
    color:       "published",
    url:         `${process.env.SITE_URL ?? ""}/editorials/${projectId}`,
  });
}
