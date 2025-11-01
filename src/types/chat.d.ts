export interface ChatMessage {
  role: "user" | "model";
  question?: string;
  answer?: string;
  timestamp: string;
}

export interface UserHistories {
  [sessionId: string]: ChatMessage[];
}

export interface RequestBody {
  message: string;
}
