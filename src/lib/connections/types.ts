export type ConnectionStatus = "pending" | "accepted" | "declined";

export type Connection = {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
};
