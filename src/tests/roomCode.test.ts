import { describe, expect, it } from 'vitest';
import { generateRoomCode, normalizeRoomCode } from '../lib/roomCode';

describe('normalizeRoomCode', () => {
  it('lowercases and hyphenates whitespace', () => {
    expect(normalizeRoomCode('  Neon Tiger 482  ')).toBe('neon-tiger-482');
  });

  it('strips characters outside [a-z0-9-_]', () => {
    expect(normalizeRoomCode('部屋/コード#1!')).toBe('1');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeRoomCode('   ')).toBe('');
  });

  it('caps length to keep it a sane Firestore path segment', () => {
    const long = 'a'.repeat(200);
    expect(normalizeRoomCode(long).length).toBe(60);
  });
});

describe('generateRoomCode', () => {
  it('produces an adjective-noun-number shaped code', () => {
    expect(generateRoomCode()).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
  });

  it('normalizes to itself (already a valid room code)', () => {
    const code = generateRoomCode();
    expect(normalizeRoomCode(code)).toBe(code);
  });
});
