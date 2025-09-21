import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  constructor(private configService: ConfigService) {}

  // Get encryption key from environment or generate one
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (key) {
      return Buffer.from(key, 'hex');
    }

    // Generate a key for development (in production, use a fixed key from env)
    return crypto.scryptSync(
      this.configService.get<string>('JWT_SECRET', 'default-secret'),
      'salt',
      this.keyLength
    );
  }

  // Encrypt data
  encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipherGCM(this.algorithm, key);
    cipher.setIV(iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  // Decrypt data
  decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipherGCM(this.algorithm, key);
    decipher.setIV(iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash sensitive data (one-way)
  hash(data: string, saltRounds: number = 12): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(data, 'salt', 64, { N: 1024, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      });
    });
  }

  // Generate secure random token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt object fields
  encryptObjectFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const encryptedObj = { ...obj };

    fieldsToEncrypt.forEach(field => {
      if (encryptedObj[field] && typeof encryptedObj[field] === 'string') {
        encryptedObj[field] = this.encrypt(encryptedObj[field]) as any;
      }
    });

    return encryptedObj;
  }

  // Decrypt object fields
  decryptObjectFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decryptedObj = { ...obj };

    fieldsToDecrypt.forEach(field => {
      if (decryptedObj[field] && typeof decryptedObj[field] === 'string') {
        try {
          decryptedObj[field] = this.decrypt(decryptedObj[field]) as any;
        } catch (error) {
          // If decryption fails, keep original value
          console.warn(`Failed to decrypt field ${String(field)}`);
        }
      }
    });

    return decryptedObj;
  }

  // Encrypt file data
  encryptFile(buffer: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipherGCM(this.algorithm, key);
    cipher.setIV(iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return { encrypted, iv, authTag };
  }

  // Decrypt file data
  decryptFile(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipherGCM(this.algorithm, key);
    decipher.setIV(iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted;
  }
}