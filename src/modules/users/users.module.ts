import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/db/db.module";
import { UsersCacheService } from "./users-cache.service";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersRepository, UsersCacheService],
  exports: [UsersService, UsersRepository, UsersCacheService],
  controllers: [UsersController],
})
export class UsersModule {}
