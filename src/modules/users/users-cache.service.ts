import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class UsersCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(UsersCacheService.name);
  private client: Redis | null = null;
  private ttl: number;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("redis.host") ?? "127.0.0.1";
    const port = this.configService.get<number>("redis.port") ?? 6379;
    this.ttl = this.configService.get<number>("redis.ttl") ?? 300;

    try {
      this.client = new Redis({ host, port, retryStrategy: () => null, lazyConnect: true });
      this.client.on("error", (err) => {
        this.isAvailable = false;
        this.logger.debug(`Redis error: ${err.message}`);
      });
      this.client.on("connect", () => {
        this.isAvailable = true;
        this.logger.log("Redis connected successfully");
      });
      this.client.connect().catch(() => {
        this.isAvailable = false;
        this.logger.warn("Failed to connect to Redis. Caching will be disabled.");
      });
    } catch (e) {
      this.logger.warn(`Failed to initialize Redis: ${(e as Error).message}`);
      this.client = null;
    }
  }

  private keyForId(id: number) {
    return `user:id:${id}`;
  }

  private keyForLookup(emailOrName: string) {
    return `user:lookup:${emailOrName.toLowerCase()}`;
  }

  async getById<T = unknown>(id: number): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null;
    try {
      const key = this.keyForId(id);
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.debug("Failed to get cached user by ID", (e as Error).message);
      return null;
    }
  }

  async setById<T = unknown>(id: number, value: T, ttlSeconds?: number) {
    if (!this.isAvailable || !this.client) return;
    try {
      const key = this.keyForId(id);
      const ttl = ttlSeconds ?? this.ttl;
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (e) {
      this.logger.debug("Failed to set cached user by ID", (e as Error).message);
    }
  }

  async delById(id: number) {
    if (!this.isAvailable || !this.client) return;
    try {
      const key = this.keyForId(id);
      await this.client.del(key);
    } catch (e) {
      this.logger.debug("Failed to delete cached user by ID", (e as Error).message);
    }
  }

  async getByLookup<T = unknown>(emailOrName: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null;
    try {
      const key = this.keyForLookup(emailOrName);
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.debug("Failed to get cached user by lookup", (e as Error).message);
      return null;
    }
  }

  async setByLookup<T = unknown>(emailOrName: string, value: T, ttlSeconds?: number) {
    if (!this.isAvailable || !this.client) return;
    try {
      const key = this.keyForLookup(emailOrName);
      const ttl = ttlSeconds ?? this.ttl;
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (e) {
      this.logger.debug("Failed to set cached user by lookup", (e as Error).message);
    }
  }

  async delByLookup(emailOrName: string) {
    if (!this.isAvailable || !this.client) return;
    try {
      const key = this.keyForLookup(emailOrName);
      await this.client.del(key);
    } catch (e) {
      this.logger.debug("Failed to delete cached user by lookup", (e as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (e) {
        this.logger.debug("Error closing Redis client");
      }
    }
  }
}
