import { useCallback, useEffect, useState } from "react";
import { 
  AlertCircle,
  CheckCircle,
  Loader2,
  Megaphone, 
  MessageCircle, 
  Mic, 
  RefreshCw,
  Send, 
  Users 
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "@/services/adminService";

const channels = [
  { name: "SMS Advisory", reach: "18,240 recipients", status: "Alerted" },
  { name: "Facebook Live", reach: "Municipal page", status: "Ready" },
  { name: "Community Radio 98.5", reach: "On standby", status: "Live" },
  { name: "Barangay Viber", reach: "42 barangays", status: "Scheduled" },
];

const statusTone = {
  Armed: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Ready: "bg-primary/10 text-primary",
  Live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Scheduled: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

const notificationTypes = [
  { value: "emergency", label: "Emergency Alert", color: "rose" },
  { value: "warning", label: "Warning", color: "amber" },
  { value: "info", label: "Information", color: "blue" },
  { value: "update", label: "Update", color: "emerald" },
];

export const BroadcastControl = () => {
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  
  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getNotifications();
      // Get last 5 broadcasts
      setRecentBroadcasts((data || []).slice(0, 5));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      setSendError("Please fill in both subject and message");
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      await adminService.createNotification({
        title: subject,
        message: message,
        type: notificationType,
      });
      setSendSuccess(true);
      setSubject("");
      setMessage("");
      fetchNotifications(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Error sending broadcast:", error);
      setSendError("Failed to send broadcast. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Broadcast Communication Control"
        description="Coordinate city-wide advisories and deliver consistent messaging across digital, SMS, and radio channels."
        actions={
          <button 
            onClick={fetchNotifications}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Message composer
          </h3>
          <p className="text-sm text-foreground/60">
            Draft advisories and broadcast to all users.
          </p>

          {/* Success/Error Messages */}
          {sendSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              Broadcast sent successfully!
            </div>
          )}
          {sendError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4" />
              {sendError}
            </div>
          )}

          <div className="mt-5 space-y-4 text-sm text-foreground/70">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Notification Type
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setNotificationType(type.value)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      notificationType === type.value
                        ? `bg-${type.color}-500 text-white`
                        : "border border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Heavy rainfall advisory for low-lying barangays"
                className="mt-2 w-full rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Message body
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Key message, affected areas, expected timeline, call-to-action, contact details"
                className="mt-2 w-full rounded-3xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <Users className="h-4 w-4" /> Audience segments
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                <MessageCircle className="h-4 w-4" /> Templates
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-foreground/60">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                <Mic className="h-3.5 w-3.5" /> PIO approval required
              </span>
              <span>Auto-translate: Enabled (Tagalog/Ilocano)</span>
            </div>
            <button 
              onClick={handleSendBroadcast}
              disabled={isSending || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending ? "Sending..." : "Send broadcast"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Channels</h3>
            <div className="mt-4 space-y-3 text-sm">
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {channel.name}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {channel.reach}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[channel.status]
                    }`}
                  >
                    {channel.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Recent Broadcasts</h3>
            <p className="text-xs text-foreground/60">Last 5 notifications sent</p>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentBroadcasts.length === 0 ? (
                <p className="text-center py-4 text-foreground/50">No broadcasts yet</p>
              ) : (
                recentBroadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="rounded-2xl border border-border/60 bg-background/60 p-3"
                  >
                    <p className="font-semibold text-foreground text-sm truncate">
                      {broadcast.title}
                    </p>
                    <p className="text-xs text-foreground/60 line-clamp-2 mt-1">
                      {broadcast.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        broadcast.type === 'emergency' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' :
                        broadcast.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' :
                        broadcast.type === 'update' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                      }`}>
                        {broadcast.type || 'info'}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {new Date(broadcast.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
