import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const start = async () => {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("/vue-chat/api");
  await app.listen(PORT, () => console.log(`server started on port ${PORT}`));
};

start();
