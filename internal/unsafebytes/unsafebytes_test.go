package unsafebytes

import "testing"

func TestByteSliceToInt(t *testing.T) {
	got := BytesToInt64([]byte("10"))
	if got != 10 {
		t.Fatalf("want 10, got: %d", got)
	}
	got = BytesToInt64([]byte("01"))
	if got != 1 {
		t.Fatalf("want 1, got: %d", got)
	}
	got = BytesToInt64([]byte("0"))
	if got != 0 {
		t.Fatalf("want 0, got: %d", got)
	}
	got = BytesToInt64([]byte("-10"))
	if got != -10 {
		t.Fatalf("want -10, got: %d", got)
	}
}

func TestByteSliceToFloat(t *testing.T) {
	got := BytesToFloat32([]byte("10.24"))
	if got != 10.24 {
		t.Fatalf("want 10.24, got: %f", got)
	}
	got = BytesToFloat32([]byte("0"))
	if got != 0 {
		t.Fatalf("want 0, got: %f", got)
	}
	got = BytesToFloat32([]byte("001"))
	if got != 1 {
		t.Fatalf("want 1, got: %f", got)
	}
}

func TestBytesToString(t *testing.T) {
	got := BytesToString([]byte("foo"))
	if got != "foo" {
		t.Fatalf("want foo, got: %s", got)
	}
}

func TestBytesToBool(t *testing.T) {
	if !BytesToBool([]byte("true")) {
		t.Fatal("want true")
	}
	if BytesToBool([]byte("false")) {
		t.Fatal("want false")
	}
	if !BytesToBool([]byte("1")) {
		t.Fatal("want true")
	}
	if BytesToBool([]byte("0")) {
		t.Fatal("want false")
	}
	if BytesToBool([]byte("2")) {
		t.Fatal("want false")
	}
}

func testValidation(validationFunc func([]byte) bool, value []byte, expectation bool) func(t *testing.T) {
	return func(t *testing.T) {
		if expectation != validationFunc(value) {
			t.Fatalf("want: %t, got: %t", expectation, !expectation)
		}
	}
}

func TestBytesIsValidFloat32(t *testing.T) {
	t.Run("valid float", testValidation(BytesIsValidFloat32, []byte("1.23"), true))
	t.Run("valid float", testValidation(BytesIsValidFloat32, []byte("123"), true))
	t.Run("invalid float", testValidation(BytesIsValidFloat32, []byte("1.2.3"), false))
	t.Run("invalid float", testValidation(BytesIsValidFloat32, []byte("true"), false))
	t.Run("invalid float", testValidation(BytesIsValidFloat32, []byte("\"1.23\""), false))
}

func TestBytesIsValidInt64(t *testing.T) {
	t.Run("valid int", testValidation(BytesIsValidInt64, []byte("123"), true))
	t.Run("invalid int", testValidation(BytesIsValidInt64, []byte("1.23"), false))
	t.Run("invalid int", testValidation(BytesIsValidInt64, []byte("true"), false))
	t.Run("invalid int", testValidation(BytesIsValidInt64, []byte("\"123\""), false))
}

func TestBytesIsValidBool(t *testing.T) {
	t.Run("valid bool", testValidation(BytesIsValidBool, []byte("true"), true))
	t.Run("valid bool", testValidation(BytesIsValidBool, []byte("false"), true))
	t.Run("invalid bool", testValidation(BytesIsValidBool, []byte("0"), true))
	t.Run("invalid bool", testValidation(BytesIsValidBool, []byte("1"), true))
	t.Run("invalid bool", testValidation(BytesIsValidBool, []byte("\"false\""), false))
	t.Run("invalid bool", testValidation(BytesIsValidBool, []byte("2"), false))
}

func BenchmarkByteSliceToInt(b *testing.B) {

	in := []byte("1024")

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		out := BytesToInt64(in)
		if out != 1024 {
			b.Fatalf("want 1024, got: %d", out)
		}
	}
}

func BenchmarkByteSliceToFloat(b *testing.B) {

	in := []byte("10.24")

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		out := BytesToFloat32(in)
		if out != 10.24 {
			b.Fatalf("want 1024, got: %f", out)
		}
	}
}

func BenchmarkByteSliceToString(b *testing.B) {

	in := []byte("foo")

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		out := BytesToString(in)
		if out != "foo" {
			b.Fatalf("want 1024, got: %s", out)
		}
	}
}
