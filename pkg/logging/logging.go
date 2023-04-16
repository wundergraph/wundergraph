package logging

import (
	"context"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	"github.com/davecgh/go-spew/spew"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	RequestIDHeader = "X-Request-Id"

	// logger field name must be aligned with fastify
	requestIDField = "reqId"
)

type RequestIDKey struct{}

func New(prettyLogging bool, debug bool, level zapcore.Level) *zap.Logger {
	return newZapLogger(zapcore.AddSync(os.Stdout), prettyLogging, debug, level)
}

func zapBaseEncoderConfig() zapcore.EncoderConfig {
	ec := zap.NewProductionEncoderConfig()
	ec.EncodeDuration = zapcore.SecondsDurationEncoder
	ec.TimeKey = "time"
	return ec
}

func zapJsonEncoder() zapcore.Encoder {
	ec := zapBaseEncoderConfig()
	ec.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		nanos := t.UnixNano()
		millis := int64(math.Trunc(float64(nanos) / float64(time.Millisecond)))
		enc.AppendInt64(millis)
	}
	return zapcore.NewJSONEncoder(ec)
}

func zapConsoleEncoder() zapcore.Encoder {
	ec := zapBaseEncoderConfig()
	ec.ConsoleSeparator = " "
	ec.EncodeTime = zapcore.TimeEncoderOfLayout("15:04:05 PM")
	ec.EncodeLevel = zapcore.CapitalColorLevelEncoder
	return zapcore.NewConsoleEncoder(ec)
}

func newZapLogger(syncer zapcore.WriteSyncer, prettyLogging bool, debug bool, level zapcore.Level) *zap.Logger {
	var encoder zapcore.Encoder
	var zapOpts []zap.Option

	if prettyLogging {
		encoder = zapConsoleEncoder()
	} else {
		encoder = zapJsonEncoder()
	}

	if debug {
		zapOpts = append(zapOpts, zap.AddStacktrace(zap.ErrorLevel))
		zapOpts = append(zapOpts, zap.AddCaller())
	}

	zapLogger := zap.New(zapcore.NewCore(
		encoder,
		syncer,
		level,
	), zapOpts...)

	if prettyLogging {
		return zapLogger
	}

	host, err := os.Hostname()
	if err != nil {
		host = "unknown"
	}

	return zapLogger.With(
		zap.String("hostname", host),
		zap.Int("pid", os.Getpid()),
	)
}

func FindLogLevel(logLevel string) (zapcore.Level, error) {
	switch strings.ToUpper(logLevel) {
	case "DEBUG":
		return zap.DebugLevel, nil
	case "INFO":
		return zap.InfoLevel, nil
	case "WARNING":
		return zap.WarnLevel, nil
	case "ERROR":
		return zap.ErrorLevel, nil
	case "FATAL":
		return zap.FatalLevel, nil
	case "PANIC":
		return zap.PanicLevel, nil
	default:
		return -1, fmt.Errorf("unknown log level: %s", logLevel)
	}
}

func RequestIDFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	spew.Dump("------------>\nRequestIDFromContext", ctx)
	requestID, ok := ctx.Value(RequestIDKey{}).(string)
	if !ok {
		return ""
	}

	return requestID
}

func WithRequestID(reqID string) zap.Field {
	return zap.String(requestIDField, reqID)
}

func WithRequestIDFromContext(ctx context.Context) zap.Field {
	return WithRequestID(RequestIDFromContext(ctx))
}
