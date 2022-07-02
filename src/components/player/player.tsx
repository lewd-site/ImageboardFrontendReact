import { useCallback, useEffect, useRef, useState } from 'react';
import Html5PlayerModel from '../../player/html5';
import IPlayerModel, {
  DURATION_CHANGED,
  PlayerState,
  STATE_CHANGED,
  TIME_UPDATED,
  VOLUME_CHANGED,
} from '../../player/player';
import YouTubePlayerModel from '../../player/youtube';
import { cls } from '../../utils';
import { SeekBar } from './seek-bar';

interface PlayerProps {
  readonly type: string;
  readonly url: string;
}

const STORAGE_VOLUME_KEY = 'player.volume';
const DEFAULT_VOLUME = 0.5;
const CONTROLS_HIDE_DELAY = 2500;

function formatTime(value: number): string {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value / 60) % 60;
  const seconds = Math.floor(value) % 60;

  if (hours > 0) {
    const hoursStr = hours.toString();
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  if (minutes > 0) {
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    return `${minutesStr}:${secondsStr}`;
  }

  const secondsStr = seconds.toString().padStart(2, '0');
  return `00:${secondsStr}`;
}

export function Player({ type, url }: PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<IPlayerModel>();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    modelRef.current =
      type === 'video/x-youtube'
        ? new YouTubePlayerModel(containerRef.current!, url)
        : new Html5PlayerModel(containerRef.current!, url);

    modelRef.current.subscribe(STATE_CHANGED, (state) => {
      switch (state) {
        case PlayerState.PLAYING:
          return setPlaying(true);

        case PlayerState.ENDED:
          return modelRef.current?.play();

        case PlayerState.PAUSED:
        default:
          return setPlaying(false);
      }
    });

    modelRef.current.subscribe<number>(VOLUME_CHANGED, (volume) => {
      setVolume(volume);
      localStorage.setItem(STORAGE_VOLUME_KEY, volume.toString());
    });

    modelRef.current.subscribe<number>(TIME_UPDATED, setCurrentTime);
    modelRef.current.subscribe<number>(DURATION_CHANGED, setDuration);

    modelRef.current.once(STATE_CHANGED, () => {
      const volume = localStorage.getItem(STORAGE_VOLUME_KEY);
      modelRef.current?.setVolume(Math.max(0, Math.min(volume !== null ? Number(volume) : DEFAULT_VOLUME, 1)));
    });

    modelRef.current.play();

    return () => modelRef.current?.dispose();
  }, [url]);

  const onPlayClick = useCallback(() => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    if (modelRef.current.playing) {
      modelRef.current.pause();
    } else {
      modelRef.current.play();
    }
  }, []);

  const volumeBeforeMute = useRef(DEFAULT_VOLUME);

  const onMuteClick = useCallback(() => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    if (modelRef.current.volume > 0) {
      volumeBeforeMute.current = modelRef.current.volume;
      modelRef.current.setVolume(0);
    } else {
      modelRef.current.setVolume(volumeBeforeMute.current);
    }
  }, []);

  const onFullscreenClick = useCallback(() => {
    if (fullscreen) {
      document.exitFullscreen();
    } else {
      playerRef.current?.requestFullscreen();
    }
  }, [fullscreen]);

  useEffect(() => {
    function handler() {
      setFullscreen(document.fullscreenElement !== null);
    }

    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const controlsRef = useRef<any>(null);
  const seekBarRef = useRef<any>(null);

  useEffect(() => {
    function handler(event: Event) {
      if (fullscreen) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    playerRef.current?.addEventListener('pointerdown', handler);
    return () => playerRef.current?.removeEventListener('pointerdown', handler);
  }, [fullscreen]);

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault();
      event.stopPropagation();
    }

    controlsRef.current?.addEventListener('pointerdown', handler);
    seekBarRef.current?.addEventListener('pointerdown', handler);

    return () => {
      controlsRef.current?.removeEventListener('pointerdown', handler);
      seekBarRef.current?.removeEventListener('pointerdown', handler);
    };
  }, []);

  const onVolumeChange = useCallback((value: number) => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    modelRef.current.setVolume(Math.max(0, Math.min(value, 1)));
  }, []);

  const onSeek = useCallback((value: number, seeking: boolean) => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    const { duration } = modelRef.current;
    modelRef.current.seek(Math.max(0, Math.min(value * duration, duration - 0.1)), !seeking);
  }, []);

  const playingBeforeSeek = useRef(false);

  const onStartSeeking = useCallback(() => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    playingBeforeSeek.current = modelRef.current.playing;
    modelRef.current.pause();
  }, [playing]);

  const onEndSeeking = useCallback(() => {
    if (typeof modelRef.current === 'undefined' || modelRef.current === null) {
      return;
    }

    if (playingBeforeSeek.current) {
      modelRef.current.play();
    }
  }, []);

  const hideControlsTimeoutRef = useRef<any>(null);

  const onPointerEnter = useCallback(() => {
    setControlsVisible(true);

    if (hideControlsTimeoutRef.current !== null) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }

    hideControlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  const onPointerMove = useCallback(() => {
    setControlsVisible(true);

    if (hideControlsTimeoutRef.current !== null) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }

    hideControlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  const onPointerLeave = useCallback(() => {
    if (hideControlsTimeoutRef.current !== null) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  return (
    <div
      className="player"
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      ref={playerRef}
    >
      <div className="player__video" ref={containerRef}></div>

      <div
        className={cls(['player__controls', `player__controls_${controlsVisible ? 'visible' : 'hidden'}`])}
        ref={controlsRef}
      >
        <div className="player__controls-left">
          <button className="player__play" onClick={onPlayClick}>
            <span className={cls(['icon', `icon_player-${playing ? 'pause' : 'play'}`])}></span>
          </button>

          <button className="player__mute" onClick={onMuteClick}>
            <span className={cls(['icon', `icon_player-${volume > 0 ? 'sound' : 'no-sound'}`])}></span>
          </button>

          <SeekBar className="player__volume-bar" value={100 * volume} maxValue={100} onChange={onVolumeChange} />

          <div className="player__time">{`${formatTime(currentTime)} / ${formatTime(duration)}`}</div>
        </div>

        <div className="player__controls-center"></div>

        <div className="player__controls-right">
          <button className="player__fullscreen" onClick={onFullscreenClick}>
            <span className={cls(['icon', `icon_player-fullscreen-${fullscreen ? 'leave' : 'enter'}`])}></span>
          </button>
        </div>

        <SeekBar
          className="player__seek-bar"
          value={currentTime}
          maxValue={duration}
          onChange={onSeek}
          onStartSeeking={onStartSeeking}
          onEndSeeking={onEndSeeking}
        />
      </div>
    </div>
  );
}
