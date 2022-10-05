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
	ec.EncodeTime = zapcore.RFC3339TimeEncoder

	if encodeAsJSON {
		encoder = zapcore.NewJSONEncoder(ec)
	} else {
		ec.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoder = zapcore.NewConsoleEncoder(ec)
	}

	return zap.New(zapcore.NewCore(
		encoder,
		syncer,
		lvl,
	))
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
