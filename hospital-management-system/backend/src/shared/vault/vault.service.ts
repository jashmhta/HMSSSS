import { Injectable, Logger } from '@nestjs/common';
import * as Vault from 'node-vault';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private vault: Vault.client;

  constructor() {
    this.vault = Vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ENDPOINT || 'http://vault:8200',
      token: process.env.VAULT_TOKEN,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Health check
      const health = await this.vault.health();
      this.logger.log('Vault connection established', health);

      // Initialize transit engine for encryption
      await this.ensureTransitEngine();
    } catch (error) {
      this.logger.error('Failed to initialize Vault', error);
      throw error;
    }
  }

  private async ensureTransitEngine(): Promise<void> {
    try {
      await this.vault.mount({
        mount_point: 'transit',
        type: 'transit',
        description: 'HMS encryption engine',
      });
    } catch (error) {
      // Engine might already exist
      this.logger.warn('Transit engine may already exist', error.message);
    }
  }

  async encryptData(plaintext: string, keyName = 'hms-data'): Promise<string> {
    const result = await this.vault.write(`transit/encrypt/${keyName}`, {
      plaintext: Buffer.from(plaintext).toString('base64'),
    });
    return result.data.ciphertext;
  }

  async decryptData(ciphertext: string, keyName = 'hms-data'): Promise<string> {
    const result = await this.vault.write(`transit/decrypt/${keyName}`, {
      ciphertext,
    });
    return Buffer.from(result.data.plaintext, 'base64').toString();
  }

  async storeSecret(path: string, data: Record<string, any>): Promise<void> {
    await this.vault.write(`secret/data/${path}`, { data });
  }

  async getSecret(path: string): Promise<Record<string, any>> {
    const result = await this.vault.read(`secret/data/${path}`);
    return result.data.data;
  }

  async rotateKey(keyName = 'hms-data'): Promise<void> {
    await this.vault.write(`transit/keys/${keyName}/rotate`, {});
    this.logger.log(`Encryption key rotated: ${keyName}`);
  }
}
