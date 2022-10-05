package logging

import (
	"os"

	"github.com/jensneuse/abstractlogger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func zapLogger(lvl zapcore.Level, syncer zapcore.WriteSyncer, encodeAsJSON bool) *zap.Logger {
	var encoder zapcore.Encoder
	ec := zap.NewProductionEncoderConfig()
	ec.EncodeDuration = zapcore.SecondsDurationEncoder
	ec.TimeKey = "time"
	ec.ConsoleSeparator = " "

	if encodeAsJSON {
		encoder = zapcore.NewJSONEncoder(ec)
		ec.EncodeTime = zapcore.EpochNanosTimeEncoder
	} else {
		ec.EncodeTime = zapcore.RFC3339TimeEncoder
		ec.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoder = zapcore.NewConsoleEncoder(ec)
	}

	zapLogger := zap.New(zapcore.NewCore(
		encoder,
		syncer,
		lvl,
	))

	host, err := os.Hostname()
	if err != nil {
		host = "unknown"
	}

	return zapLogger.With(
		zap.String("hostname", host),
		zap.Int("pid", os.Getpid()))
}

func New(level abstractlogger.Level, encodeAsJSON bool) abstractlogger.Logger {
	zapLog := zapLogger(zap.DebugLevel, zapcore.AddSync(os.Stdout), encodeAsJSON)
	return abstractlogger.NewZapLogger(zapLog, level)
}

func FindLogLevel(logLevel string, defaultLevel abstractlogger.Level) abstractlogger.Level {
	switch logLevel {
	case "debug":
		return abstractlogger.DebugLevel
	case "warn":
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
