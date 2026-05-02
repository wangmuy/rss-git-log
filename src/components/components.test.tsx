import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FeedItem } from './FeedItem';
import { SubscriptionManager } from './SubscriptionManager';
import { SettingsPanel } from './SettingsPanel';
import { ConfigPage } from './ConfigPage';
import { Header } from './Header';

describe('FeedItem', () => {
  it('renders item content and marks as read on click', () => {
    const onMarkAsRead = vi.fn();

    render(
      <FeedItem
        item={{
          guid: '1',
          title: 'Article title',
          link: 'https://example.com/a',
          pubDate: '2026-01-01',
          description: '<p>Description</p>'
        }}
        isRead={false}
        onMarkAsRead={onMarkAsRead}
      />
    );

    fireEvent.click(screen.getByText('Article title'));

    expect(screen.getByText('Description')).toBeTruthy();
    expect(onMarkAsRead).toHaveBeenCalled();
  });
});

describe('SubscriptionManager', () => {
  it('renders existing subscriptions and save action', () => {
    render(
      <SubscriptionManager
        sites={[{ name: 'Example', url: 'https://example.com/rss', color: '#1976d2' }]}
        onSitesChange={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('Example')).toBeTruthy();
    expect(screen.getByText('Save to GitHub')).toBeTruthy();
  });
});

describe('SettingsPanel', () => {
  it('updates show-read setting', () => {
    const onSettingsChange = vi.fn();

    render(
      <SettingsPanel
        settings={{ showReadItems: false, autoCommit: false, commitInterval: 300 }}
        onSettingsChange={onSettingsChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Show Read Items'));

    expect(onSettingsChange).toHaveBeenCalledWith({ showReadItems: true });
  });
});

describe('ConfigPage', () => {
  it('renders runtime configuration sections', () => {
    localStorage.clear();

    render(<ConfigPage />);

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('Commit')).toBeTruthy();
    expect(screen.getByText('CORS')).toBeTruthy();
    expect(screen.getByText('Local Cache')).toBeTruthy();
  });
});

describe('Header', () => {
  it('hides manual commit when writes are unavailable', () => {
    render(
      <Header
        onRefresh={vi.fn()}
        onMarkAllRead={vi.fn()}
        onManualCommit={vi.fn()}
        onOpenConfig={vi.fn()}
        isCommitting={false}
        canWrite={false}
        lastCommit={null}
      />
    );

    expect(screen.queryByLabelText('Manual Commit')).toBeNull();
  });

  it('shows manual commit when writes are available', () => {
    render(
      <Header
        onRefresh={vi.fn()}
        onMarkAllRead={vi.fn()}
        onManualCommit={vi.fn()}
        onOpenConfig={vi.fn()}
        isCommitting={false}
        canWrite={true}
        lastCommit={null}
      />
    );

    expect(screen.getByRole('button', { name: 'Manual Commit' })).toBeTruthy();
  });
});
