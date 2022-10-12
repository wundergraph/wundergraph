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
		encoder = zapcore.NewConsoleEncoder(ec)
	}
	return zap.New(zapcore.NewCore(
		encoder,
		syncer,
		lvl,
	))
}

func New(level abstractlogger.Level, encodeAsJSON bool) abstractlogger.Logger {
	zapLog := zapLogger(zap.DebugLevel, zapcore.AddSync(os.Stderr), encodeAsJSON)
	return abstractlogger.NewZapLogger(zapLog, level)
}
