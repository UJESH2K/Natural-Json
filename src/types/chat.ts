export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatResponse {
  messages: ChatMessage[];
  workflowJson?: object; // Optional workflow JSON if applicable
}

export interface ChatInput {
  content: string;
}