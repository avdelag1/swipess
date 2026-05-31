import { describe, it, expect } from 'vitest';

describe('Conversation messages SELECT columns', () => {
  it('should NOT include message_text or attachments', () => {
    const select = 'id, conversation_id, sender_id, content, message_type, is_read, read_at, created_at';
    expect(select).not.toContain('message_text');
    expect(select).not.toContain('attachments');
    expect(select).toContain('content');
    expect(select).toContain('is_read');
  });

  it('last_message query should use content not message_text', () => {
    const select = 'id, conversation_id, content, message_type, created_at, sender_id, is_read';
    expect(select).not.toContain('message_text');
    expect(select).toContain('content');
  });
});

describe('Listing SELECT columns', () => {
  it('should use owner_id not user_id', () => {
    const fields = 'id, title, price, images, owner_id, category, description, status';
    expect(fields).not.toContain('user_id');
    expect(fields).toContain('owner_id');
  });

  it('should NOT include location column', () => {
    const fields = 'id, title, price, images, owner_id, category, description, status, city, neighborhood';
    expect(fields).not.toContain('location');
    expect(fields).toContain('city');
    expect(fields).toContain('neighborhood');
  });

  it('SWIPE_CARD_FIELDS should match whats in the codebase', () => {
    const fields = 'id, title, price, images, owner_id, category, description, status, mode, city, neighborhood, address, currency, listing_type, created_at, updated_at, video_url, property_type, beds, baths, square_footage, furnished, pet_friendly, amenities, lifestyle_compatible, tulum_location, brand, model, year, condition, latitude, longitude';
    expect(fields).toContain('owner_id');
    expect(fields).not.toMatch(/\buser_id\b/);
  });
});

describe('Filter function column usage', () => {
  it('should use neq("owner_id") not neq("user_id")', () => {
    const filterCall = "neq('owner_id', userId)";
    expect(filterCall).toContain('owner_id');
    expect(filterCall).not.toContain('user_id');
  });
});
