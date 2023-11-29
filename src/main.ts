import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const bcrypt = require('bcrypt');

const start = async () => {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    process.env.VFCODE_SALT = bcrypt.genSaltSync(10);
    await app.listen(PORT, () => console.log(`server started on port ${PORT}`));
}

start();