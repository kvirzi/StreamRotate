import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Show } from '../types';

interface EpisodeTimelineProps {
  shows: Show[];
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Horizontal timeline of upcoming episodes. A vertical "now" line separates
 * episodes that have already aired (left) from those yet to air (right).
 * The line advances each week as the current date moves forward.
 */
export function EpisodeTimeline({ shows }: EpisodeTimelineProps) {
  const data = useMemo(() => {
    const withDates = shows
      .filter(s => s.next_air_date)
      .map(s => ({ show: s, at: new Date(`${s.next_air_date}T00:00:00`).getTime() }))
      .filter(d => !Number.isNaN(d.at))
      .sort((a, b) => a.at - b.at);

    if (!withDates.length) return null;

    const now = Date.now();
    // Window: from a week before now (or the earliest episode) to the last
    // episode, with at least a 6-week horizon so the "now" line has room to move.
    const earliest = Math.min(withDates[0].at, now - 7 * DAY);
    const latest = Math.max(withDates[withDates.length - 1].at, now + 42 * DAY);
    const start = earliest - 2 * DAY;
    const end = latest + 2 * DAY;
    const span = end - start;

    const pct = (t: number) => ((t - start) / span) * 100;

    // Weekly gridlines aligned to the upcoming Mondays.
    const ticks: { left: number; label: string }[] = [];
    const firstTick = new Date(start);
    firstTick.setHours(0, 0, 0, 0);
    for (let t = firstTick.getTime(); t <= end; t += 7 * DAY) {
      ticks.push({
        left: pct(t),
        label: new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }

    return {
      nowLeft: pct(now),
      ticks,
      items: withDates.map(d => ({
        id: d.show.id,
        title: d.show.title,
        left: pct(d.at),
        aired: d.at <= now,
        dateLabel: new Date(d.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      })),
    };
  }, [shows]);

  if (!data) return null;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <CalendarClock size={18} className="text-accent-teal" />
        <h2 className="font-display font-semibold text-text-primary">Episode Timeline</h2>
      </div>

      <div className="relative pt-6 pb-2" style={{ minHeight: `${data.items.length * 34 + 40}px` }}>
        {/* Weekly gridlines */}
        {data.ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-6 border-l border-bg-border/50"
            style={{ left: `${tick.left}%` }}
          >
            <span className="absolute -top-0 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap">
              {tick.label}
            </span>
          </div>
        ))}

        {/* "Now" line */}
        <div
          className="absolute top-4 bottom-6 border-l-2 border-accent-orange z-10"
          style={{ left: `${data.nowLeft}%` }}
        >
          <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-semibold text-accent-orange whitespace-nowrap">
            Now
          </span>
        </div>

        {/* Show rows */}
        {data.items.map((item, i) => (
          <div key={item.id} className="absolute left-0 right-0" style={{ top: `${28 + i * 34}px` }}>
            <div
              className="absolute flex items-center gap-1.5 -translate-y-1/2"
              style={{
                left: `${item.left}%`,
                transform: `translate(${item.left > 60 ? '-100%' : '0'}, -50%)`,
              }}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.aired ? 'bg-bg-border' : 'bg-accent-teal'}`} />
              <span className={`text-xs whitespace-nowrap ${item.aired ? 'text-text-muted' : 'text-text-primary'}`}>
                {item.title}
                <span className="text-text-muted ml-1">· {item.dateLabel}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-2 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-teal" /> Yet to air
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-bg-border" /> Already aired
        </span>
      </div>
    </div>
  );
}
