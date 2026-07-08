/* eslint-disable */
import type { FastifyPluginAsync } from "fastify";

interface MockNotification {
  id: string;
  residentId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

const mockNotifications: MockNotification[] = [];

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /notifications
  app.get("/", async (_req, _reply) => {
    return { success: true, data: mockNotifications };
  });

  // GET /notifications/:residentId/latest
  app.get("/:residentId/latest", async (req, _reply) => {
    const { residentId } = req.params as { residentId: string };
    const latest = mockNotifications.find(
      (n) => n.residentId === residentId && !n.isRead
    );
    return { success: true, data: latest || null };
  });

  // POST /notifications
  app.post("/", async (req, _reply) => {
    const body = req.body as {
      residentId: string;
      title: string;
      message: string;
      type?: string;
    };

    const newNotification: MockNotification = {
      id: "notif-" + Math.random().toString(36).substring(2, 9),
      residentId: body.residentId || "usr-mock-1",
      title: body.title || "Collection Incoming",
      message: body.message || "The waste truck is approaching your street.",
      isRead: false,
      type: body.type || "PICKUP_ALERT",
      createdAt: new Date().toISOString(),
    };

    mockNotifications.unshift(newNotification);

    return { success: true, data: newNotification };
  });

  // PATCH /notifications/:id/read
  app.patch("/:id/read", async (req, _reply) => {
    const { id } = req.params as { id: string };
    const notif = mockNotifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
    }
    return { success: true, data: notif || null };
  });

  // PATCH /notifications/resident/:residentId/read-all
  app.patch("/resident/:residentId/read-all", async (req, _reply) => {
    const { residentId } = req.params as { residentId: string };
    mockNotifications.forEach((n) => {
      if (n.residentId === residentId) {
        n.isRead = true;
      }
    });
    return { success: true };
  });
};
