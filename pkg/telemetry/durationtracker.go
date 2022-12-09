package telemetry

import "time"

type DurationTracker struct {
	tracks map[string]time.Time
}

func NewDurationTracker() *DurationTracker {
	return &DurationTracker{
		tracks: make(map[string]time.Time),
	}
}

func (d *DurationTracker) Start(name string) {
	d.tracks[name] = time.Now()
}

func (d *DurationTracker) Stop(name string) time.Duration {
	start, ok := d.tracks[name]
	if !ok {
		return 0
	}

	delete(d.tracks, name)

	return time.Since(start)
}

func (d *DurationTracker) Tracks() map[string]time.Time {
	return d.tracks
}
