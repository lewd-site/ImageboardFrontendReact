import { useEffect, useMemo, useState } from 'react';
import { cls } from '../utils';

interface TimeAgoProps {
  readonly className?: string;
  readonly value: Date;
}

const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_DAY = 60 * 60 * 24;

function useSecondsSince(value: Date) {
  const timestamp = useMemo(() => {
    return value.getTime() / MS_IN_SECOND;
  }, [value]);

  const [now, setNow] = useState(Date.now() / MS_IN_SECOND);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / MS_IN_SECOND), 5 * MS_IN_SECOND);
    return () => clearInterval(id);
  }, [timestamp]);

  const difference = Math.max(0, now - timestamp);
  return { difference };
}

function formatPlural(value: number, forms: string[]) {
  if (value === 0) {
    return `меньше ${forms[1]}`;
  }

  if (value === 1) {
    return forms[0];
  }

  if ((value % 100 > 4 && value % 100 < 20) || value % 10 > 5) {
    return `${value} ${forms[2]}`;
  }

  return `${value} ${forms[[2, 0, 1, 1, 1][value % 5]]}`;
}

export function TimeAgo({ className, value }: TimeAgoProps) {
  const { difference } = useSecondsSince(value);
  const text = useMemo(() => {
    const minutes = Math.floor(difference / SECONDS_IN_MINUTE);
    if (minutes < 60) {
      return formatPlural(minutes, ['минуту', 'минуты', 'минут']) + ' назад';
    }

    const hours = Math.floor(difference / SECONDS_IN_HOUR);
    if (hours < 24) {
      return formatPlural(hours, ['час', 'часа', 'часов']) + ' назад';
    }

    const days = Math.floor(difference / SECONDS_IN_DAY);
    return formatPlural(days, ['день', 'дня', 'дней']) + ' назад';
  }, [difference]);

  return (
    <time className={cls([className])} dateTime={value.toISOString()} title={value.toLocaleString()}>
      {text}
    </time>
  );
}
