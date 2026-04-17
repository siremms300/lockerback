// src/utils/generators.ts
import * as QRCode from 'qrcode';

export const generateTrackingNumber = (): string => {
  const prefix = 'LKR';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const generatePin = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};