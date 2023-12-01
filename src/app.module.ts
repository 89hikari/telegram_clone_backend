import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./db/db.module";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from "./modules/auth/auth.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { AppGateway } from "./app.socket";

@Module({
    controllers: [AppController],
    providers: [AppService, AppGateway],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        UsersModule,
        MessagesModule,
        AuthModule
    ]
})
export class AppModule { }