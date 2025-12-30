export interface MessageResponseDto {
  id: number;
  message: string;
  senderId: number;
  receiverId: number;
  date: string;
  time?: string;
  isMe: boolean;
}
