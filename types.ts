export interface SvgAttributes {
  viewBox: string | null;
  width: string | null;
  height: string | null;
  paths: string[];
}

export enum TabOption {
  PLAYGROUND = 'PLAYGROUND',
  SOLUTION = 'SOLUTION',
}
