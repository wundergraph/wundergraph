package logging

import (
	"fmt"
	"math"
	"os"
	"strings"
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
	// TO HAVE LINES LOGGING ENABLE THIS
	// ), zap.AddCaller(), zap.AddCallerSkip(1))

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

func FindLogLevel(logLevel string) (abstractlogger.Level, error) {
	switch strings.ToUpper(logLevel) {
	case "DEBUG":
		return abstractlogger.DebugLevel, nil
	case "INFO":
		return abstractlogger.InfoLevel, nil
	case "WARNING":
		return abstractlogger.WarnLevel, nil
	case "ERROR":
		return abstractlogger.ErrorLevel, nil
	case "FATAL":
		return abstractlogger.FatalLevel, nil
	case "PANIC":
		return abstractlogger.PanicLevel, nil
	default:
		return -1, fmt.Errorf("unknown log level: %s", logLevel)
	}
}
