import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

afterEach(cleanup);

describe('ConfirmDialog', () => {
  it('renders at the document root so parent stacking contexts cannot hide its actions', () => {
    const onConfirm = vi.fn();
    const { container } = render(
      <div className="screen-transition">
        <ConfirmDialog
          open
          title="対局会設定を解除"
          message="記録済みの半荘データは削除されません。"
          confirmLabel="設定を解除"
          onCancel={vi.fn()}
          onConfirm={onConfirm}
        />
      </div>,
    );

    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveClass('z-[100]');

    fireEvent.click(screen.getByRole('button', { name: '設定を解除' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
