import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('loads fictional frame demo and triggers click event', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('status')).toContainText('Tap the picture frame.');
  await screen.getByRole('button', 'INSPECT FRAME').click();
  await expect(screen.getByRole('status')).toContainText('mark appears');
});

test('navigates between two fictional rooms', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('status')).toContainText('Tap the picture frame.');
  await screen.getByRole('button', 'GO TO HALL').click();
  await expect(screen.getByRole('button', 'Explore the test room')).toHaveAttribute('aria-label','Scene test-hall');
  await screen.getByRole('button', 'GO TO HALL').click();
  await expect(screen.getByRole('button', 'Explore the test room')).toHaveAttribute('aria-label','Scene test-room');
});

test('saves and restores a stable checkpoint', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('status')).toContainText('Tap the picture frame.');
  await screen.getByRole('button', 'INSPECT FRAME').click();
  await expect(screen.getByRole('status')).toContainText('mark appears');
  await screen.getByRole('button', 'SAVE').click();
  await expect(screen.getByRole('status')).toContainText('Checkpoint saved');
  await screen.getByRole('button', 'RESET').click();
  await screen.getByRole('button', 'RESUME').click();
  await expect(screen.getByRole('status')).toContainText('Checkpoint resumed');
});
