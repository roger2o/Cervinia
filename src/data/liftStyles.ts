import type { PathOptions } from 'leaflet';

export interface LiftStyle extends PathOptions {
  label: boolean;
}

const aerial: LiftStyle = {
  color: '#ea580c',
  weight: 3,
  opacity: 0.9,
  dashArray: undefined,
  label: true,
};

const chair: LiftStyle = {
  color: '#16a34a',
  weight: 2.5,
  opacity: 0.9,
  dashArray: undefined,
  label: true,
};

const drag: LiftStyle = {
  color: '#92400e',
  weight: 2,
  opacity: 0.8,
  dashArray: '6 4',
  label: true,
};

const service: LiftStyle = {
  color: '#d1d5db',
  weight: 1.5,
  opacity: 0.5,
  dashArray: '3 3',
  label: false,
};

const liftStyleMap: Record<string, LiftStyle> = {
  gondola: aerial,
  cable_car: aerial,
  funicular: aerial,
  mixed_lift: aerial,
  chair_lift: chair,
  't-bar': drag,
  platter: drag,
  drag_lift: drag,
  magic_carpet: drag,
  goods: service,
  yes: drag,
};

export function getLiftStyle(liftType: string | undefined): LiftStyle {
  return liftStyleMap[liftType ?? ''] ?? drag;
}
