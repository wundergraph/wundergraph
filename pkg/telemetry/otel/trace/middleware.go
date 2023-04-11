package trace

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/felixge/httpsnoop"
	"github.com/gorilla/mux"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/semconv/v1.17.0/httpconv"
	oteltrace "go.opentelemetry.io/otel/trace"
)

const (
	tracerName = "otelmux"
)

// MuxMiddleware sets up a handler to start tracing the incoming
// requests.  The service parameter should describe the name of the
// (virtual) server handling the request.
func MuxMiddleware(service string, provider oteltrace.TracerProvider) mux.MiddlewareFunc {
	tracer := provider.Tracer(
		tracerName,
	)

	return func(handler http.Handler) http.Handler {
		return traceware{
			service:           service,
			tracer:            tracer,
			propagators:       defaultPropagators(),
			handler:           handler,
			spanNameFormatter: spanNameFormatter,
		}
	}
}

type traceware struct {
	service           string
	tracer            oteltrace.Tracer
	propagators       propagation.TextMapPropagator
	handler           http.Handler
	spanNameFormatter func(string, *http.Request) string
}

type recordingResponseWriter struct {
	writer  http.ResponseWriter
	written bool
	status  int
}

var rrwPool = &sync.Pool{
	New: func() interface{} {
		return &recordingResponseWriter{}
	},
}

func getRRW(writer http.ResponseWriter) *recordingResponseWriter {
	rrw := rrwPool.Get().(*recordingResponseWriter)
	rrw.written = false
	rrw.status = http.StatusOK
	rrw.writer = httpsnoop.Wrap(writer, httpsnoop.Hooks{
		Write: func(next httpsnoop.WriteFunc) httpsnoop.WriteFunc {
			return func(b []byte) (int, error) {
				if !rrw.written {
					rrw.written = true
				}
				return next(b)
			}
		},
		WriteHeader: func(next httpsnoop.WriteHeaderFunc) httpsnoop.WriteHeaderFunc {
			return func(statusCode int) {
				if !rrw.written {
					rrw.written = true
					rrw.status = statusCode
				}
				next(statusCode)
			}
		},
	})
	return rrw
}

func putRRW(rrw *recordingResponseWriter) {
	rrw.writer = nil
	rrwPool.Put(rrw)
}

func spanNameFormatter(routeName string, r *http.Request) string {
	return fmt.Sprintf("%s %s", r.Method, routeName)
}

func defaultPropagators() propagation.TextMapPropagator {
	return propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)
}

// ServeHTTP implements the http.Handler interface. It does the actual
// tracing of the request.
func (tw traceware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := tw.propagators.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
	routeStr := ""
	route := mux.CurrentRoute(r)
	if route != nil {
		var err error
		routeStr, err = route.GetPathTemplate()
		if err != nil {
			routeStr, err = route.GetPathRegexp()
			if err != nil {
				routeStr = ""
			}
		}
	}
	opts := []oteltrace.SpanStartOption{
		oteltrace.WithAttributes(httpconv.ServerRequest(tw.service, r)...),
		oteltrace.WithSpanKind(oteltrace.SpanKindServer),
	}
	if routeStr == "" {
		routeStr = fmt.Sprintf("HTTP %s route not found", r.Method)
	} else {
		rAttr := semconv.HTTPRoute(routeStr)
		opts = append(opts, oteltrace.WithAttributes(rAttr))
	}
	spanName := tw.spanNameFormatter(routeStr, r)
	ctx, span := tw.tracer.Start(ctx, spanName, opts...)
	defer span.End()
	r2 := r.WithContext(ctx)
	rrw := getRRW(w)
	defer putRRW(rrw)
	tw.handler.ServeHTTP(rrw.writer, r2)
	if rrw.status > 0 {
		span.SetAttributes(semconv.HTTPStatusCode(rrw.status))
	}

	if rrw.status < 500 {
		span.SetStatus(codes.Ok, "")
	} else {
		span.SetStatus(codes.Error, fmt.Sprintf("%d %s", rrw.status, http.StatusText(rrw.status)))
	}
}

func HTTPClientTransporter(rt http.RoundTripper, provider oteltrace.TracerProvider) http.RoundTripper {
	transport := &transport{
		rt: rt,
	}

	return otelhttp.NewTransport(
		transport,
		otelhttp.WithSpanNameFormatter(spanNameFormatter),
		otelhttp.WithTracerProvider(provider),
		otelhttp.WithPropagators(defaultPropagators()),
	)
}

type transport struct {
	rt http.RoundTripper
}

func (t *transport) RoundTrip(r *http.Request) (*http.Response, error) {
	span := SpanFromContext(r.Context())

	// otelhttp client transport does not provide a path to the span name formatter, so we have to do it manually
	// redefine the span name
	span.SetName(fmt.Sprintf("%s %s", r.Method, r.URL.Path))

	resp, err := t.rt.RoundTrip(r)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return resp, err
	}

	if resp.StatusCode >= 500 {
		span.SetStatus(codes.Error, fmt.Sprintf("%d %s", resp.StatusCode, resp.Status))
		return resp, nil
	}

	span.SetStatus(codes.Ok, "")
	return resp, err
}
