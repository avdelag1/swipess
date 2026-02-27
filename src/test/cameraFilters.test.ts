import { CAMERA_FILTERS, FilterType } from '@/utils/cameraFilters';

describe('CAMERA_FILTERS utility', () => {
  it('exports the full set of filter types expected by the UI', () => {
    const expected: FilterType[] = [
      'none',
      'vivid',
      'warm',
      'cool',
      'vintage',
      'noir',
      'dramatic',
      'silvertone',
      'fade',
      'white',
      'carbon',
    ];

    const keys = Object.keys(CAMERA_FILTERS) as FilterType[];
    expect(keys.sort()).toEqual(expected.sort());
  });

  it('configures the white filter to produce a bright/grayscale effect', () => {
    const { cssFilter } = CAMERA_FILTERS.white;
    expect(cssFilter).toContain('saturate(0)');
    expect(cssFilter).toContain('brightness(');
  });
});
