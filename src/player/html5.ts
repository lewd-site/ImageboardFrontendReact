import EventEmitter from '../event-emitter';
import { DURATION_CHANGED, IPlayerModel, PlayerState, STATE_CHANGED, TIME_UPDATED, VOLUME_CHANGED } from './player';

export class Html5PlayerModel extends EventEmitter implements IPlayerModel {
  protected _video: HTMLVideoElement;

  public constructor(protected readonly container: HTMLDivElement, protected readonly url: string) {
    super();

    this._video = document.createElement('video');
    this._video.preload = 'metadata';
    this._video.addEventListener('loadedmetadata', this._onLoadedMetadata);
    this._video.addEventListener('timeupdate', this._onTimeUpdated);
    this._video.addEventListener('volumechange', this._onVolumeChanged);
    this._video.addEventListener('play', this._onPlay);
    this._video.addEventListener('pause', this._onPause);
    this._video.addEventListener('ended', this._onEnded);

    const source = document.createElement('source');
    source.src = url;

    this._video.appendChild(source);
    container.appendChild(this._video);
  }

  protected _onLoadedMetadata = () => this.dispatch(DURATION_CHANGED, this.duration);
  protected _onTimeUpdated = () => this.dispatch(TIME_UPDATED, this.currentTime);
  protected _onVolumeChanged = () => this.dispatch(VOLUME_CHANGED, this.volume);
  protected _onPlay = () => this.dispatch(STATE_CHANGED, PlayerState.PLAYING);
  protected _onPause = () => this.dispatch(STATE_CHANGED, PlayerState.PAUSED);
  protected _onEnded = () => this.dispatch(STATE_CHANGED, PlayerState.ENDED);

  public get playing(): boolean {
    return !this._video.paused;
  }

  public get volume(): number {
    return this._video.volume;
  }

  public get currentTime(): number {
    return this._video.currentTime;
  }

  public get duration(): number {
    return this._video.duration;
  }

  public play(): void {
    this._video.play();
  }

  public pause(): void {
    this._video.pause();
  }

  public setVolume(value: number): void {
    this._video.muted = value === 0;
    this._video.volume = value;
  }

  public seek(time: number, load: boolean): void {
    if (isNaN(time)) {
      return;
    }

    this._video.currentTime = time;
  }

  public dispose() {
    super.dispose();

    this._video.removeEventListener('loadedmetadata', this._onLoadedMetadata);
    this._video.removeEventListener('timeupdate', this._onTimeUpdated);
    this._video.removeEventListener('volumechange', this._onVolumeChanged);
    this._video.removeEventListener('play', this._onPlay);
    this._video.removeEventListener('pause', this._onPause);
    this._video.removeEventListener('ended', this._onEnded);
    this._video.remove();
  }
}

export default Html5PlayerModel;
