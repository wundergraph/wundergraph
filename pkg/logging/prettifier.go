package logging

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/iancoleman/orderedmap"
	"go.uber.org/zap/buffer"
)

const (
	levelMinChars         = 5 // pad logging levels to this size, so they look aligned
	prettyTimestampFormat = "15:04:05.000"
)

type printerFunc func(w io.Writer, a ...interface{})

var (
	levelPrinters = map[string]printerFunc{
		"trace": color.New(color.FgCyan).FprintFunc(),
		"debug": color.New(color.FgMagenta).FprintFunc(),
		"info":  color.New(color.FgBlue).FprintFunc(),
		"warn":  color.New(color.FgYellow).FprintFunc(),
		"error": color.New(color.FgRed).FprintFunc(),
		"fatal": color.New(color.FgHiRed).FprintFunc(),
	}

	grayPrinter = color.New(color.FgHiBlack).FprintFunc()
	fmtPrinter  = func(w io.Writer, a ...interface{}) {
		fmt.Fprint(w, a...)
	}
)

func float64ToTimestamp(f float64) (time.Time, bool) {
	const margin = time.Hour
	i := int64(f)
	now := time.Now()
	nanoNow := now.UnixNano()
	nanoMin := nanoNow - int64(margin)/int64(time.Nanosecond)
	nanoMax := nanoNow + int64(margin)/int64(time.Nanosecond)
	if nanoMin < i && i < nanoMax {
		return time.Unix(0, i), true
	}
	milliNow := now.UnixMilli()
	milliMin := milliNow - int64(margin)/int64(time.Millisecond)
	milliMax := milliNow + int64(margin)/int64(time.Millisecond)
	if milliMin < i && i < milliMax {
		return time.UnixMilli(i), true
	}
	return time.Time{}, false
}

type PrettifierConfig struct {
	DisableColor  bool
	LevelKey      string
	MessageKey    string
	CallerKey     string
	TimeKey       string
	StacktraceKey string
	ComponentKey  string
	IgnoredKeys   []string
}

type Prettifier struct {
	pool          buffer.Pool
	disableColor  bool
	levelKey      string
	messageKey    string
	componentKey  string
	callerKey     string
	timeKey       string
	stacktraceKey string
	ignoredKeys   map[string]struct{}
}

func NewPrettifier(config PrettifierConfig) *Prettifier {
	levelKey := config.LevelKey
	if levelKey == "" {
		levelKey = logLevelKey
	}
	messageKey := config.MessageKey
	if messageKey == "" {
		messageKey = logMessageKey
	}
	componentKey := config.ComponentKey
	if componentKey == "" {
		componentKey = logComponentKey
	}
	callerKey := config.CallerKey
	if callerKey == "" {
		callerKey = logCallerKey
	}
	timeKey := config.TimeKey
	if timeKey == "" {
		timeKey = logTimeKey
	}
	stacktraceKey := config.StacktraceKey
	if stacktraceKey == "" {
		stacktraceKey = logStacktraceKey
	}
	ignoredKeys := make(map[string]struct{}, len(config.IgnoredKeys))
	for _, k := range config.IgnoredKeys {
		ignoredKeys[k] = struct{}{}
	}
	return &Prettifier{
		disableColor:  config.DisableColor,
		pool:          buffer.NewPool(),
		levelKey:      levelKey,
		messageKey:    messageKey,
		componentKey:  componentKey,
		callerKey:     callerKey,
		timeKey:       timeKey,
		stacktraceKey: stacktraceKey,
		ignoredKeys:   ignoredKeys,
	}
}

func (p *Prettifier) PrettifyJSON(r io.Reader) (*buffer.Buffer, error) {
	o := orderedmap.New()
	if err := json.NewDecoder(r).Decode(o); err != nil {
		return nil, err
	}
	levelValue, _ := o.Get(p.levelKey)
	level, _ := levelValue.(string)
	if level == "" {
		// If we can't find a log level, assume this is not a JSON log
		return nil, errors.New("can't find log level")
	}
	o.Delete(p.levelKey)
	messageValue, _ := o.Get(p.messageKey)
	message, ok := messageValue.(string)
	if ok {
		o.Delete(p.messageKey)
	}
	componentValue, _ := o.Get(p.componentKey)
	component, ok := componentValue.(string)
	if ok {
		o.Delete(p.componentKey)
	}
	callerValue, _ := o.Get(p.callerKey)
	caller, ok := callerValue.(string)
	if ok {
		o.Delete(p.callerKey)
	}

	timestampValue, _ := o.Get(p.timeKey)
	timestamp, ok := timestampValue.(float64)
	if ok {
		o.Delete(p.timeKey)
	}

	stackTraceValue, _ := o.Get(p.stacktraceKey)
	stackTrace, ok := stackTraceValue.(string)
	if ok {
		o.Delete(p.stacktraceKey)
	}

	var logTime time.Time
	if timestamp > 0 {
		logTime = time.UnixMilli(int64(timestamp))
	} else {
		logTime = time.Now()
	}
	secondaryTextPrinter := p.secondaryTextPrinter()
	buf := p.pool.Get()
	s := logTime.Format(prettyTimestampFormat)
	secondaryTextPrinter(buf, s)
	buf.WriteByte(' ')
	levelPrinter := p.levelPrinter(level)
	levelPrinter(buf, strings.ToUpper(level))
	remaining := levelMinChars - len(level)
	if remaining > 0 {
		levelPrinter(buf, strings.Repeat(" ", remaining))
	}
	if component != "" {
		buf.WriteByte(' ')
		secondaryTextPrinter(buf, component)
	}
	if caller != "" {
		buf.WriteByte(' ')
		if component != "" {
			secondaryTextPrinter(buf, "(")
		}
		secondaryTextPrinter(buf, caller)
		if component != "" {
			secondaryTextPrinter(buf, ")")
		}
	}
	if message != "" {
		buf.WriteByte(' ')
		buf.WriteString(message)
	}
	for _, key := range o.Keys() {
		if _, found := p.ignoredKeys[key]; found {
			continue
		}
		buf.WriteByte(' ')
		buf.WriteString(key)
		secondaryTextPrinter(buf, "=")
		value, _ := o.Get(key)
		switch x := value.(type) {
		case string:
			fmt.Fprintf(buf, "\"%s\"", x)
		case float64:
			if ts, ok := float64ToTimestamp(x); ok {
				fmt.Fprintf(buf, "%v", ts)
			} else {
				fmt.Fprintf(buf, "%v", x)
			}
		case []interface{}, orderedmap.OrderedMap:
			// These might be arbitrarily nested, display them as JSON
			j, err := json.Marshal(x)
			if err == nil {
				fmt.Fprintf(buf, "%s", string(j))
			} else {
				fmt.Fprintf(buf, "%v", x)
			}
		default:
			fmt.Fprintf(buf, "%v", x)
		}
	}
	buf.WriteByte('\n')
	if stackTrace != "" {
		buf.WriteString(stackTrace)
		buf.WriteByte('\n')
	}
	return buf, nil
}

func (p *Prettifier) secondaryTextPrinter() printerFunc {
	if p.disableColor {
		return fmtPrinter
	}
	return grayPrinter
}

func (p *Prettifier) levelPrinter(level string) printerFunc {
	if !p.disableColor {
		coloredPrinter := levelPrinters[level]
		if coloredPrinter != nil {
			return coloredPrinter
		}
	}
	return fmtPrinter
}
