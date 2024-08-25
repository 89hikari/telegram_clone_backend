import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppGateway } from './app.socket';
import { DatabaseModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { MessagesModule } from './modules/messages/messages.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  providers: [AppGateway],
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, UsersModule, MessagesModule, AuthModule],
})
export class AppModule {}
