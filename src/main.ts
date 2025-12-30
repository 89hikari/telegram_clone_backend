import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AppConfig } from "./config/app.config";

const start = async () => {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>("app");
  const port = appConfig?.port ?? 5000;

  // Enable CORS
  app.enableCors({
    origin: appConfig?.corsOrigins || ["http://localhost:3000"],
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix(appConfig?.globalPrefix || "/vue-chat/api");

  // Enable URI versioning: routes will be available under /v1/, /v2/, etc.
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "v",
  });

  // Add global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port, () => console.log(`Server started on port ${port}`));
};

start();
