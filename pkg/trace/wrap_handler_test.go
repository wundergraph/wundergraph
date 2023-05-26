package trace

import (
	"github.com/gorilla/mux"
	"github.com/wundergraph/wundergraph/pkg/trace/tracetest"
	"go.opentelemetry.io/otel/codes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func TestWrapHttpHandler(t *testing.T) {

	t.Run("create a span for every request", func(t *testing.T) {
		exporter := tracetest.NewInMemoryExporter(t)

		router := mux.NewRouter()

		router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		h := WrapHandler(router, "")

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		sn := exporter.GetSpans().Snapshots()
		assert.Len(t, sn, 1)
		assert.Equal(t, "GET /test", sn[0].Name())
		assert.Equal(t, trace.SpanKindServer, sn[0].SpanKind())
		assert.Equal(t, sdktrace.Status{Code: codes.Unset}, sn[0].Status())
		assert.Len(t, sn[0].Attributes(), 8)
	})

	t.Run("set span status to error", func(t *testing.T) {
		exporter := tracetest.NewInMemoryExporter(t)

		router := mux.NewRouter()

		router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
		})

		h := WrapHandler(router, "")

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		sn := exporter.GetSpans().Snapshots()
		assert.Len(t, sn, 1)
		assert.Equal(t, "GET /test", sn[0].Name())
		assert.Equal(t, sdktrace.Status{Code: codes.Error, Description: "Bad Request"}, sn[0].Status())
		assert.Equal(t, trace.SpanKindServer, sn[0].SpanKind())
		assert.Len(t, sn[0].Attributes(), 8)
	})
}
