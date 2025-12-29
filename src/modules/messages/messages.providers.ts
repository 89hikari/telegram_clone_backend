import { Message } from "./message.entity";

export const messagesProvider = [
  {
    provide: "MESSAGE_REPOSITORY",
    useValue: Message,
  },
];
