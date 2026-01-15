import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import * as Joi from "joi";
import { AppGateway } from "./app.socket";
import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";
import redisConfig from "./config/redis.config";
import throttleConfig from "./config/throttle.config";
import { DatabaseModule } from "./db/db.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  providers: [AppGateway, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, redisConfig, throttleConfig],
      validationSchema: Joi.object({
        PORT: Joi.number().default(5000),
        API_PREFIX: Joi.string().default("/vue-chat/api"),
        CORS_ORIGINS: Joi.string().allow("", null),
        REDIS_HOST: Joi.string().default("127.0.0.1"),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_TTL: Joi.number().default(300),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(5),
        JWTKEY: Joi.string().required(),
        TOKEN_EXPIRATION: Joi.string().default("1d"),
        RESEND_API_KEY: Joi.string().allow("", null),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in ms
        limit: 200, // max 200 requests per ttl
      },
    ]),
    DatabaseModule,
    UsersModule,
    GroupsModule,
    MessagesModule,
    AuthModule,
  ],
})
export class AppModule {}
