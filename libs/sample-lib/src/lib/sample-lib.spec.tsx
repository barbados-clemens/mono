import { render } from '@testing-library/react';

import SampleLib from './sample-lib';

describe('SampleLib', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SampleLib />);
    expect(baseElement).toBeTruthy();
  });
});
