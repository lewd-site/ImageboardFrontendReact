import EventEmitter from '../event-emitter';
import { DURATION_CHANGED, IPlayerModel, PlayerState, STATE_CHANGED, TIME_UPDATED, VOLUME_CHANGED } from './player';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

let youtubeApiLoadedPromise: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (youtubeApiLoadedPromise !== null) {
    return youtubeApiLoadedPromise;
  }

  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';

  document.head.insertAdjacentElement('beforeend', script);

  return (youtubeApiLoadedPromise = new Promise((resolve) => (window.onYouTubeIframeAPIReady = resolve)));
}

const TIME_UPDATE_INTERVAL = 200;

class YouTubePlayerModel extends EventEmitter implements IPlayerModel {
  protected _iframe: any = null;
  protected _player: any = null;
  protected _timeUpdatedInterval: any = null;
  protected _onReady = () => {};

  public constructor(protected readonly container: HTMLDivElement, protected readonly url: string) {
    super();

    this._iframe = document.createElement('div');
    container.appendChild(this._iframe);

    const matches = this.url.match(
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)(?:\/|\/v\/|\/embed\/|.*v=).*([a-z0-9_-]{11})/i
    );
    const videoId = matches !== null ? matches[1] : null;

    loadYoutubeApi().then(() => {
      this._player = new window.YT.Player(this._iframe, {
        videoId,
        host: `${window.location.protocol}//www.youtube.com`,
        playerVars: {
          color: 'white',
          controls: 0,
          enablejsapi: 1,
          fs: 0,
          hl: 'ru',
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.dispatch(DURATION_CHANGED, this.duration);
            this._onReady();
          },
          onStateChange: ({ data }: any) => {
            if (data === window.YT.PlayerState.PLAYING) {
              this.dispatch(STATE_CHANGED, PlayerState.PLAYING);
              this.dispatch(TIME_UPDATED, this.currentTime);

              if (this._timeUpdatedInterval !== null) {
                clearInterval(this._timeUpdatedInterval);
              }

              this._timeUpdatedInterval = setInterval(
                () => this.dispatch(TIME_UPDATED, this.currentTime),
                TIME_UPDATE_INTERVAL
              );
            } else if (data === window.YT.PlayerState.PAUSED) {
              this.dispatch(STATE_CHANGED, PlayerState.PAUSED);

              if (this._timeUpdatedInterval !== null) {
                clearInterval(this._timeUpdatedInterval);
                this._timeUpdatedInterval = null;
              }
            } else if (data === window.YT.PlayerState.ENDED) {
              this.dispatch(STATE_CHANGED, PlayerState.ENDED);

              if (this._timeUpdatedInterval !== null) {
                clearInterval(this._timeUpdatedInterval);
                this._timeUpdatedInterval = null;
              }
            }
          },
        },
      });
    });
  }

  public get playing(): boolean {
    if (
      this._player === null ||
      typeof window.YT === 'undefined' ||
      typeof this._player.getPlayerState !== 'function'
    ) {
      return false;
    }

    return this._player.getPlayerState() === window.YT.PlayerState.PLAYING;
  }

  public get volume(): number {
    if (this._player === null || typeof this._player.isMuted !== 'function') {
      return 0.5;
    }

    return this._player.isMuted() ? 0 : this._player.getVolume() / 100;
  }

  public get currentTime(): number {
    if (this._player === null || typeof this._player.getCurrentTime !== 'function') {
      return 0;
    }

    return this._player.getCurrentTime();
  }

  public get duration(): number {
    if (this._player === null || typeof this._player.getDuration !== 'function') {
      return 0;
    }

    return this._player.getDuration();
  }

  public play(): void {
    if (this._player === null || typeof this._player.playVideo !== 'function') {
      this._onReady = () => this._player?.playVideo();
    } else {
      this._player.playVideo();
    }
  }

  public pause(): void {
    if (this._player === null || typeof this._player.pauseVideo !== 'function') {
      return;
    }

    this._player.pauseVideo();
  }

  public setVolume(value: number): void {
    if (this._player === null || typeof this._player.isMuted !== 'function') {
      return;
    }

    const muted = this._player.isMuted();
    if (value === 0 && !muted) {
      this._player.mute();
    } else if (value > 0 && muted) {
      this._player.unMute();
    }

    this._player.setVolume(100 * value);
    this.dispatch(VOLUME_CHANGED, value);
  }

  public seek(time: number, load: boolean): void {
    if (this._player === null || typeof this._player.seekTo !== 'function') {
      return;
    }

    this._player.seekTo(time, load);
    this.dispatch(TIME_UPDATED, time);
  }

  public dispose() {
    super.dispose();

    if (this._timeUpdatedInterval !== null) {
      clearInterval(this._timeUpdatedInterval);
      this._timeUpdatedInterval = null;
    }

    this._player?.destroy();
    this._iframe?.remove();
  }
}

export default YouTubePlayerModel;
