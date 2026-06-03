import { useEffect, useState, useCallback } from "react";
import axios from "axios";

type Notification = {
  id: string;
  type: string;
  offerId?: string;
  supplierId?: string;
  supplierResponseId?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const API_BASE = "https://api.digitservz.dz/api";

export default function OfferNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/notifications`);
      setNotifications(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unread = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    loadNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications offres
          </h2>
          <p className="text-sm text-gray-500">
            {unread.length} notification(s) non lue(s)
          </p>
        </div>

        <button
          type="button"
          onClick={loadNotifications}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">
          Chargement...
        </div>
      ) : unread.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
          Aucune notification non lue.
        </div>
      ) : (
        <div className="space-y-3">
          {unread.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 ${
                notification.type === "deadline_expired"
                  ? "border-red-300 bg-red-100"
                  : notification.type === "deadline_reminder"
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className={`text-sm font-semibold ${
                      notification.type === "deadline_expired"
                        ? "text-red-900"
                        : notification.type === "deadline_reminder"
                          ? "text-amber-900"
                          : notification.type === "negative_response"
                            ? "text-red-800"
                            : "text-gray-900"
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-700">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Marquer lu
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
