import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { MessageDto } from "./modules/messages/message.dto";
import { MessagesService } from "./modules/messages/messages.service";
import { UsersService } from "./modules/users/users.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly userService: UsersService,
  ) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage("sendMessage")
  async handleSendMessage(client: Socket, payload: MessageDto): Promise<void> {
    const peer = Array.from(this.server.sockets.sockets.values()).find((el) => el.data?.userId === payload.receiverId);
    const senderInfo = await this.userService.findOneById(client.data?.userId);
    const newMessage = {
      messageId: uuidv4(),
      self: true,
      date: new Date(),
      senderInfo,
      ...payload,
    };
    client.emit("newMessage", newMessage);
    newMessage.self = false;
    peer?.emit("newMessage", newMessage);
  }

  private async getConnentedPeers(curUserID: number) {
    if (!curUserID) return;
    const connectedUsers = Array.from(this.server.sockets.sockets.values()).map((el) => ({
      connectionId: el.id,
      userId: el.data?.userId,
    }));
    const peersIdsQuery = await this.messagesService.getPeersWithConversations(curUserID);
    const peersIds = [
      ...new Set(
        peersIdsQuery
          .map(({ dataValues }) => dataValues)
          ?.reduce((acc, curr) => [...acc, curr.receiverId, curr.senderId], [])
          .filter((el: number) => el != curUserID),
      ),
    ];

    return connectedUsers.filter((el) => peersIds.indexOf(el.userId) !== -1);
  }

  @SubscribeMessage("initUser")
  async initUser(client: Socket, payload: { userId: number }): Promise<void> {
    client.data["userId"] = payload.userId;
    const connectedPeers = await this.getConnentedPeers(payload.userId);
    connectedPeers?.map((connectionData) => {
      this.server.sockets.sockets.get(connectionData.connectionId)?.emit("newUserConnected", {
        connectionId: client.id,
        userId: payload.userId,
      });
    });
    client.emit("connectedPeers", connectedPeers);
  }

  afterInit(server: Server) {
    console.log(server);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    const connectedPeers = await this.getConnentedPeers(userId);
    connectedPeers?.map((connectionData) => {
      this.server.sockets.sockets.get(connectionData.connectionId)?.emit("userDisconnected", {
        connectionId: client.id,
        userId: userId,
      });
    });
    client.data = {};
    await this.userService.setLastSeen(userId);
    console.log(`Disconnected: ${client.id}`);
  }

  handleConnection(client: Socket) {
    console.log(`Connected ${client.id}`);
  }
}
