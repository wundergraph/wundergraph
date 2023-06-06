package pool

import (
	"bytes"
	"context"
	"hash"
	"net/http"
	"sync"

	"github.com/cespare/xxhash"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/astnormalization"
	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/astprinter"
	"github.com/wundergraph/graphql-go-tools/pkg/astvalidation"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/graphql-go-tools/pkg/operationreport"
	p2 "github.com/wundergraph/graphql-go-tools/pkg/pool"
	"github.com/wundergraph/graphql-go-tools/pkg/postprocess"
)

func GetBytesBuffer() *bytes.Buffer {
	buf := p2.BytesBuffer.Get()
	buf.Reset()
	return buf
}

func PutBytesBuffer(buf *bytes.Buffer) {
	p2.BytesBuffer.Put(buf)
}

var (
	ctxPool sync.Pool
)

type Config struct {
	RenameTypeNames []resolve.RenameTypeName
}

const (
	ClientRequestKey = "__wg_clientRequest"
)

func GetCtx(r, clientRequest *http.Request, cfg Config) *resolve.Context {
	next := ctxPool.Get()
	ctx := context.WithValue(r.Context(), ClientRequestKey, clientRequest)
	if next == nil {
		resolveCtx := resolve.NewContext(ctx)
		resolveCtx.Request.Header = r.Header
		resolveCtx.RenameTypeNames = cfg.RenameTypeNames
		return resolveCtx
	}
	resolveContext := next.(*resolve.Context).WithContext(ctx)
	resolveContext.Request.Header = r.Header
	resolveContext.RenameTypeNames = cfg.RenameTypeNames
	return resolveContext
}

func PutCtx(ctx *resolve.Context) {
	ctx.Free()
	ctxPool.Put(ctx)
}

type Pool struct {
	pool sync.Pool
}

func New() *Pool {
	return &Pool{}
}

type Shared struct {
	Doc         *ast.Document
	Planner     *plan.Planner
	Parser      *astparser.Parser
	Printer     *astprinter.Printer
	Hash        hash.Hash64
	Validation  *astvalidation.OperationValidator
	Normalizer  *astnormalization.OperationNormalizer
	Postprocess postprocess.PostProcessor
	Report      *operationreport.Report
	Ctx         *resolve.Context
}

func (s *Shared) Reset() {
	s.Doc.Reset()
	s.Hash.Reset()
	s.Report.Reset()
	s.Ctx.Free()
}

func (p *Pool) GetShared(ctx context.Context, planConfig plan.Configuration, cfg Config) *Shared {
	shared := p.pool.Get()
	if shared != nil {
		s := shared.(*Shared)
		s.Planner.SetConfig(planConfig)
		s.Ctx = s.Ctx.WithContext(ctx)
		s.Ctx.RenameTypeNames = cfg.RenameTypeNames
		return s
	}
	c := resolve.NewContext(ctx)
	c.RenameTypeNames = cfg.RenameTypeNames
	return &Shared{
		Doc:         ast.NewDocument(),
		Planner:     plan.NewPlanner(ctx, planConfig),
		Parser:      astparser.NewParser(),
		Printer:     &astprinter.Printer{},
		Hash:        xxhash.New(),
		Validation:  astvalidation.DefaultOperationValidator(),
		Normalizer:  astnormalization.NewNormalizer(true, true),
		Postprocess: postprocess.DefaultProcessor(),
		Report:      &operationreport.Report{},
		Ctx:         c,
	}
}

func (p *Pool) GetSharedFromRequest(ctx context.Context, clientRequest *http.Request, planConfig plan.Configuration, cfg Config) *Shared {
	shared := p.pool.Get()
	c := context.WithValue(clientRequest.Context(), ClientRequestKey, clientRequest)
	if shared != nil {
		s := shared.(*Shared)
		s.Planner.SetConfig(planConfig)
		s.Ctx = s.Ctx.WithContext(c)
		s.Ctx.Request.Header = clientRequest.Header
		s.Ctx.RenameTypeNames = cfg.RenameTypeNames
		return s
	}
	resolveCtx := resolve.NewContext(c)
	resolveCtx.Request.Header = clientRequest.Header
	resolveCtx.RenameTypeNames = cfg.RenameTypeNames
	return &Shared{
		Doc:         ast.NewDocument(),
		Planner:     plan.NewPlanner(ctx, planConfig),
		Parser:      astparser.NewParser(),
		Printer:     &astprinter.Printer{},
		Hash:        xxhash.New(),
		Validation:  astvalidation.DefaultOperationValidator(),
		Normalizer:  astnormalization.NewNormalizer(true, true),
		Postprocess: postprocess.DefaultProcessor(),
		Report:      &operationreport.Report{},
		Ctx:         resolveCtx,
	}
}

func (p *Pool) PutShared(shared *Shared) {
	shared.Reset()
	p.pool.Put(shared)
}
