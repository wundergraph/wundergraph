package logging

import (
	"math"
	"os"
	"time"

	"github.com/jensneuse/abstractlogger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var singleZap *zap.Logger

func Zap() *zap.Logger {
	if singleZap == nil {
		panic("zap logger not initialized")
	}

	return singleZap
}

func Init(prettyLogging bool) {
	singleZap = zapLogger(zapcore.AddSync(os.Stdout), !prettyLogging)
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
	ec.EncodeTime = zapcore.RFC3339TimeEncoder
	ec.EncodeLevel = zapcore.CapitalColorLevelEncoder
	return zapcore.NewConsoleEncoder(ec)
}

func zapLogger(syncer zapcore.WriteSyncer, encodeAsJSON bool) *zap.Logger {
	var encoder zapcore.Encoder

	if encodeAsJSON {
		encoder = zapJsonEncoder()
	} else {
		encoder = zapConsoleEncoder()
	}

	zapLogger := zap.New(zapcore.NewCore(
		encoder,
		syncer,
		zap.DebugLevel,
	))

	if !encodeAsJSON {
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

func FindLogLevel(logLevel string, defaultLevel abstractlogger.Level) abstractlogger.Level {
	switch logLevel {
	case "debug":
		return abstractlogger.DebugLevel
	case "warning":
		return abstractlogger.WarnLevel
	case "error":
		return abstractlogger.ErrorLevel
	case "fatal":
		return abstractlogger.FatalLevel
	case "panic":
		return abstractlogger.PanicLevel
	default:
		return defaultLevel
	}
}
