import '@testing-library/jest-dom/vitest';

import { beforeEach, vi } from 'vitest';
import { useNavigation } from '../store/useNavigation';
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  useNavigation.setState({ url: '/' });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
