import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessageDto } from './modules/messages/message.dto';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class AppGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server: Server;

    @SubscribeMessage('sendMessage')
    async handleSendMessage(payload: MessageDto & { senderId: number }): Promise<void> {
        this.server.emit(`sidebarMsgs_${[payload.receiverId]}`, payload);
        this.server.emit(`sidebarMsgs_${payload.senderId}`, payload);
        this.server.emit(`messages_${[payload.receiverId, payload.senderId].sort((a, b) => a + b).join("_")}`, payload);
    }

    afterInit(server: Server) {
        console.log(server);
    }

    handleDisconnect(client: Socket) {
        console.log(`Disconnected: ${client.id}`);
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log(`Connected ${client.id}`);
    }
}