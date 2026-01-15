export interface GroupMessageResponseDto {
  id: number;
  groupId: number;
  senderId: number;
  message: string;
  date: string;
  isMe: boolean;
}
