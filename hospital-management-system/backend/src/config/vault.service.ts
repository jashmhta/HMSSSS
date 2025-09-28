import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Vault from 'node-vault';

@Injectable()
export class VaultService implements OnModuleInit {
  private vault: Vault.client;

  async onModuleInit() {
    this.vault = Vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR || 'http://vault:8200',
      token: process.env.VAULT_TOKEN || 'root',
    });
  }

  async getSecret(path: string): Promise<any> {
    try {
      const result = await this.vault.read(path);
      return result.data;
    } catch (error) {
      console.error(`Failed to fetch secret from ${path}:`, error);
      throw error;
    }
  }

  async encrypt(plaintext: string, key: string = 'hms-key'): Promise<string> {
    const result = await this.vault.write(`transit/encrypt/${key}`, {
      plaintext: Buffer.from(plaintext).toString('base64'),
    });
    return result.data.ciphertext;
  }

  async decrypt(ciphertext: string, key: string = 'hms-key'): Promise<string> {
    const result = await this.vault.write(`transit/decrypt/${key}`, {
      ciphertext,
    });
    return Buffer.from(result.data.plaintext, 'base64').toString();
  }
}
