import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MessageDto } from "./modules/messages/message.dto";
import { MessagesService } from "./modules/messages/messages.service";
import { UsersService } from "./modules/users/users.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer() server: Server;

  /**
   * Handles incoming messages and broadcasts to recipient
   * @param client - Socket client sending message
   * @param payload - Message data
   */
  @SubscribeMessage("sendMessage")
  async handleSendMessage(client: Socket, payload: MessageDto): Promise<void> {
    try {
      await this.messagesService.handleOutgoingMessage(this.server, client, payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      this.logger.error(`Error in handleSendMessage: ${errorMessage}`, error instanceof Error ? error.stack : "");
      client.emit("messageError", {
        error: errorMessage,
        receiverId: payload?.receiverId,
      });
    }
  }

  /**
   * Retrieves peers with active conversations
   * @param curUserID - Current user ID
   * @returns Array of connected peers
   */
  private async getConnectedPeers(curUserID: number) {
    try {
      if (!curUserID) return [];

      const connectedUsers = Array.from(this.server.sockets.sockets.values()).map((el) => ({
        connectionId: el.id,
        userId: el.data?.userId,
      }));

      const peersIdsQuery = await this.messagesService.getPeersWithConversations(curUserID);
      const peersIds = [
        ...new Set(
          peersIdsQuery
            .reduce((acc: number[], curr) => [...acc, curr.receiverId, curr.senderId], [])
            .filter((el: number) => el !== curUserID),
        ),
      ];

      return connectedUsers.filter((el) => peersIds.indexOf(el.userId) !== -1);
    } catch (error) {
      this.logger.error(
        `Error in getConnectedPeers: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : "",
      );
      return [];
    }
  }

  /**
   * Initializes user connection and notifies peers
   * @param client - Socket client
   * @param payload - Payload containing userId
   */
  @SubscribeMessage("initUser")
  async initUser(client: Socket, payload?: { userId?: number }): Promise<void> {
    try {
      const authenticatedUserId = client.data?.userId;
      if (!authenticatedUserId) {
        throw new WsException("User is not authenticated. Missing JWT token.");
      }

      if (payload?.userId && payload.userId !== authenticatedUserId) {
        throw new WsException("User ID mismatch between token and payload");
      }

      client.data["userId"] = authenticatedUserId;
      const connectedPeers = await this.getConnectedPeers(authenticatedUserId);

      connectedPeers?.forEach((connectionData) => {
        this.server.sockets.sockets.get(connectionData.connectionId)?.emit("newUserConnected", {
          connectionId: client.id,
          userId: authenticatedUserId,
        });
      });

      client.emit("connectedPeers", connectedPeers);
      this.logger.log(`User ${authenticatedUserId} initialized with connection ${client.id}`);
    } catch (error) {
      const errorMessage = error instanceof WsException ? error.getError() : "Failed to initialize user";
      this.logger.error(`Error in initUser: ${errorMessage}`, error instanceof Error ? error.stack : "");
      client.emit("initError", { error: errorMessage });
    }
  }

  /**
   * Called when gateway is initialized
   */
  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized");

    server.use((socket, next) => {
      this.authenticateSocket(socket)
        .then(() => next())
        .catch((error) => {
          const message = error instanceof WsException ? error.getError() : "Unauthorized";
          this.logger.warn(`Socket authentication failed for ${socket.id}: ${message}`);
          next(new WsException(message));
        });
    });
  }

  /**
   * Handles client disconnect
   * @param client - Socket client that disconnected
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data?.userId;

      if (userId) {
        const connectedPeers = await this.getConnectedPeers(userId);
        connectedPeers?.forEach((connectionData) => {
          this.server.sockets.sockets.get(connectionData.connectionId)?.emit("userDisconnected", {
            connectionId: client.id,
            userId: userId,
          });
        });

        await this.usersService.setLastSeen(userId);
      }

      client.data = {};
      this.logger.log(`User ${userId || "unknown"} disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Error in handleDisconnect: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : "",
      );
    }
  }

  /**
   * Handles client connect
   * @param client - New socket client
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Extracts bearer token from handshake headers/auth/query
   */
  private extractToken(client: Socket): string | null {
    const headerAuth = client.handshake.headers["authorization"];
    if (typeof headerAuth === "string" && headerAuth.startsWith("Bearer ")) {
      return headerAuth.slice(7);
    }

    const authToken = client.handshake.auth?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken;
    }

    const query = client.handshake.query as Record<string, string | string[]>;
    const queryToken = query?.token;
    if (Array.isArray(queryToken)) {
      return queryToken[0] ?? null;
    }
    if (typeof queryToken === "string" && queryToken.length > 0) {
      return queryToken;
    }

    return null;
  }

  /**
   * Authenticates socket and attaches user payload
   */
  private async authenticateSocket(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException("Missing authentication token");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload?.id) {
        throw new WsException("Invalid token payload");
      }
      client.data.userId = payload.id;
      client.data.userPayload = payload;
    } catch (error) {
      this.logger.warn(`Failed to authenticate socket ${client.id}: ${error instanceof Error ? error.message : error}`);
      throw new WsException("Invalid authentication token");
    }
  }
}
