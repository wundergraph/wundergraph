package trace

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel/codes"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/wundergraph/wundergraph/pkg/trace/tracetest"
)

func TestWrapHttpHandler(t *testing.T) {

	t.Run("create a span for every request", func(t *testing.T) {
		exporter := tracetest.NewInMemoryExporter(t)

		router := mux.NewRouter()

		router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		h := WrapHandler(router, WgComponentName.String("test"))

		req := httptest.NewRequest("GET", "/test?a=b", nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		sn := exporter.GetSpans().Snapshots()
		assert.Len(t, sn, 1)
		assert.Equal(t, "GET /test", sn[0].Name())
		assert.Equal(t, trace.SpanKindServer, sn[0].SpanKind())
		assert.Equal(t, sdktrace.Status{Code: codes.Unset}, sn[0].Status())
		assert.Len(t, sn[0].Attributes(), 9)

		assert.Contains(t, sn[0].Attributes(), semconv.HTTPMethodKey.String("GET"))
		assert.Contains(t, sn[0].Attributes(), semconv.HTTPScheme("http"))
		assert.Contains(t, sn[0].Attributes(), semconv.HTTPFlavorKey.String("1.1"))
		assert.Contains(t, sn[0].Attributes(), semconv.HTTPTarget("/test?a=b"))
		assert.Contains(t, sn[0].Attributes(), semconv.HTTPStatusCode(200))
		assert.Contains(t, sn[0].Attributes(), WgComponentName.String("test"))
	})

	t.Run("set span status to error", func(t *testing.T) {
		var statusCodeTests = []struct {
			statusCode int             // input
			expected   sdktrace.Status // expected result
		}{
			{200, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{201, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{300, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{301, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{400, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{404, sdktrace.Status{Code: codes.Unset, Description: ""}},
			{500, sdktrace.Status{Code: codes.Error, Description: ""}},
		}

		exporter := tracetest.NewInMemoryExporter(t)

		for _, test := range statusCodeTests {
			router := mux.NewRouter()

			statusCode := test.statusCode

			router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(statusCode)
			})

			h := WrapHandler(router, WgComponentName.String("test"))

			req := httptest.NewRequest("GET", "/test?a=b", nil)
			w := httptest.NewRecorder()

			h.ServeHTTP(w, req)

			assert.Equal(t, statusCode, w.Code)

			sn := exporter.GetSpans().Snapshots()

			assert.Len(t, sn, 1)
			assert.Equal(t, "GET /test", sn[0].Name())
			assert.Equal(t, test.expected, sn[0].Status())
			assert.Equal(t, trace.SpanKindServer, sn[0].SpanKind())

			assert.Contains(t, sn[0].Attributes(), semconv.HTTPMethodKey.String("GET"))
			assert.Contains(t, sn[0].Attributes(), semconv.HTTPScheme("http"))
			assert.Contains(t, sn[0].Attributes(), semconv.HTTPFlavorKey.String("1.1"))
			assert.Contains(t, sn[0].Attributes(), semconv.HTTPTarget("/test?a=b"))
			assert.Contains(t, sn[0].Attributes(), semconv.HTTPStatusCode(statusCode))
			assert.Contains(t, sn[0].Attributes(), WgComponentName.String("test"))

			exporter.Reset()
		}
	})
}
