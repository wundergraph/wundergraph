package postresolvetransform

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func TestTransformer_Transform(t *testing.T) {
	runTest := func(t *testing.T, input, expectedOutput string, transformations ...*wgpb.PostResolveTransformation) {
		t.Helper()
		transformer := NewTransformer(transformations)
		out, err := transformer.Transform([]byte(input))
		assert.NoError(t, err)
		assert.Equal(t, expectedOutput, string(out))
	}

	t.Run("no transformations", func(t *testing.T) {
		runTest(t, `{"foo":"bar"}`, `{"foo":"bar"}`)
	})

	t.Run("depth 1 string", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":"baz"}}`, `{"foo":"baz"}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 int", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":123}}`, `{"foo":123}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 bool", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":true}}`, `{"foo":true}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 float", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":1.23}}`, `{"foo":1.23}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 null string", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":"null"}}`, `{"foo":"null"}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 null", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":null}}`, `{"foo":null}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 null missing", func(t *testing.T) {
		runTest(t, `{"foo":{}}`, `{"foo":null}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 2 string", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":{"baz":"bat"}}}`, `{"foo":"bat"}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar", "baz"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 2 object", func(t *testing.T) {
		runTest(t, `{"foo":{"bar":{"baz":{"foo":"bar"}}}}`, `{"foo":{"foo":"bar"}}`, &wgpb.PostResolveTransformation{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foo", "bar", "baz"},
				To:   []string{"foo"},
			},
		})
	})
	t.Run("depth 1 array", func(t *testing.T) {
		runTest(t, `{"foos":[{"foo":{"bar":"baz1"}},{"foo":{"bar":"baz2"}},{"foo":{"bar":"baz3"}}]}`,
			`{"foos":[{"foo":"baz1"},{"foo":"baz2"},{"foo":"baz3"}]}`,
			&wgpb.PostResolveTransformation{
				Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
				Get: &wgpb.PostResolveGetTransformation{
					From: []string{"foos", "[]", "foo", "bar"},
					To:   []string{"foos", "[]", "foo"},
				},
			})
	})
	t.Run("depth 2 array", func(t *testing.T) {
		runTest(t, `{"foos":[{"foo":{"bar":[{"foo":{"bar":"baz1"}}]}},{"foo":{"bar":[{"foo":{"bar":"baz2"}}]}},{"foo":{"bar":[{"foo":{"bar":"baz2"}}]}}]}`,
			`{"foos":[{"foo":{"bar":[{"foo":"baz1"}]}},{"foo":{"bar":[{"foo":"baz2"}]}},{"foo":{"bar":[{"foo":"baz2"}]}}]}`,
			&wgpb.PostResolveTransformation{
				Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
				Get: &wgpb.PostResolveGetTransformation{
					From: []string{"foos", "[]", "foo", "bar", "[]", "foo", "bar"},
					To:   []string{"foos", "[]", "foo", "bar", "[]", "foo"},
				},
			})
	})
	t.Run("depth 3 array", func(t *testing.T) {
		runTest(t, `{"foos":[{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz1"}}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz2"}}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz3"}}]}}]}}]}`,
			`{"foos":[{"foo":{"bar":[{"foo":{"bar":[{"foo":"baz1"}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":"baz2"}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":"baz3"}]}}]}}]}`,
			&wgpb.PostResolveTransformation{
				Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
				Get: &wgpb.PostResolveGetTransformation{
					From: []string{"foos", "[]", "foo", "bar", "[]", "foo", "bar", "[]", "foo", "bar"},
					To:   []string{"foos", "[]", "foo", "bar", "[]", "foo", "bar", "[]", "foo"},
				},
			})
	})
}

func BenchmarkTransformer_Transform(b *testing.B) {
	transformer := NewTransformer([]*wgpb.PostResolveTransformation{
		{
			Kind: wgpb.PostResolveTransformationKind_GET_POST_RESOLVE_TRANSFORMATION,
			Get: &wgpb.PostResolveGetTransformation{
				From: []string{"foos", "[]", "foo", "bar", "[]", "foo", "bar", "[]", "foo", "bar"},
				To:   []string{"foos", "[]", "foo", "bar", "[]", "foo", "bar", "[]", "foo"},
			},
		},
	})

	b.ResetTimer()
	b.ReportAllocs()
	b.SetBytes(187)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, _ = transformer.Transform([]byte(`{"foos":[{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz1"}}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz2"}}]}}]}},{"foo":{"bar":[{"foo":{"bar":[{"foo":{"bar":"baz3"}}]}}]}}]}`))
		}
	})
}
