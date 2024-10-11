import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MessageDto } from "./modules/messages/message.dto";
import { MessagesService } from "./modules/messages/messages.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly messagesService: MessagesService) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage("sendMessage")
  async handleSendMessage(client: any, payload: MessageDto & { senderId: number }): Promise<void> {
    this.server.emit(`messages_${[+payload.receiverId, +payload.senderId].sort().join("_")}`, payload);
    this.server.emit(`new_messages_${payload.receiverId}`, payload);
    this.server.emit(`new_messages_${payload.senderId}`, payload);
  }

  private async getConnentedPeers(curUserID: number) {
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
  async initUser(client: Socket, payload: any): Promise<void> {
    client.data["userId"] = payload.userId;
    const connectedPeers = await this.getConnentedPeers(payload.userId);
    connectedPeers.map((connectionData) => {
      this.server.sockets.sockets.get(connectionData.connectionId).emit("newUserConnected", payload.userId);
    });
    client.emit("connectedPeers", connectedPeers);
  }

  afterInit(server: Server) {
    console.log(server);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    const connectedPeers = await this.getConnentedPeers(userId);
    connectedPeers.map((connectionData) => {
      this.server.sockets.sockets.get(connectionData.connectionId).emit("userDisconnected", userId);
    });
    client.data = {};
    console.log(`Disconnected: ${client.id}`);
  }

  handleConnection(client: Socket) {
    console.log(`Connected ${client.id}`);
  }
}
