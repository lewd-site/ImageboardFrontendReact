import { IEventEmitter } from '../event-emitter';

export const DURATION_CHANGED = 'DURATION_CHANGED';
export const TIME_UPDATED = 'TIME_UPDATED';
export const VOLUME_CHANGED = 'VOLUME_CHANGED';
export const STATE_CHANGED = 'STATE_CHANGED';

export const enum PlayerState {
  PAUSED = 0,
  PLAYING = 1,
  ENDED = 2,
}

export interface IPlayerModel extends IEventEmitter {
  get playing(): boolean;
  get volume(): number;
  get currentTime(): number;
  get duration(): number;

  play(): void;
  pause(): void;
  setVolume(value: number): void;
  seek(time: number, load: boolean): void;
  dispose(): void;
}

export default IPlayerModel;
