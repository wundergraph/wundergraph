package logging

import (
	"bytes"

	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

// prettyEncoder implements a zap encoder that pretty prints its
// output to the console
type prettyEncoder struct {
	zapcore.Encoder
	prettifier *Prettifier
}

func newPrettyEncoder() zapcore.Encoder {
	enc := zapJsonEncoder()
	return &prettyEncoder{
		Encoder:    enc,
		prettifier: NewPrettifier(PrettifierConfig{}),
	}
}

func (e *prettyEncoder) Clone() zapcore.Encoder {
	clone := e.Encoder.Clone()
	return &prettyEncoder{Encoder: clone, prettifier: e.prettifier}
}

func (e *prettyEncoder) EncodeEntry(entry zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	buffer, err := e.Encoder.EncodeEntry(entry, fields)
	if err != nil {
		return nil, err
	}
	pretty, err := e.prettifier.PrettifyJSON(bytes.NewReader(buffer.Bytes()))
	if err != nil {
		// If prettifying fails, return the raw log line
		return buffer, nil
	}
	buffer.Free()
	return pretty, nil
}
