package nats

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/nats-io/nats.go"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Configuration struct {
	ServerURL string
	Token     string
	Operation wgpb.NatsKvOperation
	Bucket    string
	History   int32
}

func ConfigJson(config Configuration) json.RawMessage {
	out, _ := json.Marshal(config)
	return out
}

type Factory struct {
	connector *Connector
}

func (f *Factory) Planner(ctx context.Context) plan.DataSourcePlanner {
	if f.connector == nil {
		f.connector = &Connector{
			ctx:         ctx,
			connections: make(map[string]connection),
			mux:         &sync.Mutex{},
		}
		go f.connector.disconnectAll()
	}
	return &Planner{
		connector: f.connector,
	}
}

type Connector struct {
	ctx         context.Context
	connections map[string]connection
	mux         *sync.Mutex
}

func (c *Connector) disconnectAll() {
	<-c.ctx.Done()
	for _, conn := range c.connections {
		conn.conn.Close()
	}
}

type connection struct {
	conn *nats.Conn
	js   nats.JetStreamContext
}

func (c *Connector) connect(config Configuration) (conn *nats.Conn, js nats.JetStreamContext, err error) {
	c.mux.Lock()
	defer c.mux.Unlock()

	if conn, ok := c.connections[config.ServerURL]; ok {
		return conn.conn, conn.js, nil
	}

	conn, err = nats.Connect(config.ServerURL, nats.Token(config.Token))
	if err != nil {
		return
	}

	js, err = conn.JetStream()
	if err != nil {
		return
	}

	c.connections[config.ServerURL] = connection{
		conn: conn,
		js:   js,
	}

	return
}

type Planner struct {
	v *plan.Visitor

	connector *Connector
	config    Configuration

	rootField           int
	operationDefinition int

	input     []byte
	variables []resolve.Variable
}

func (p *Planner) Register(visitor *plan.Visitor, configuration plan.DataSourceConfiguration, isNested bool) (err error) {
	visitor.Walker.RegisterEnterFieldVisitor(p)
	visitor.Walker.RegisterEnterOperationVisitor(p)
	visitor.Walker.RegisterEnterDocumentVisitor(p)
	p.v = visitor

	if err := json.Unmarshal(configuration.Custom, &p.config); err != nil {
		return err
	}

	return nil
}

func (p *Planner) EnterDocument(operation, definition *ast.Document) {
	p.rootField = -1
	p.operationDefinition = -1
	p.input = []byte(`{}`)
	p.variables = nil
}

func (p *Planner) EnterOperationDefinition(ref int) {
	p.operationDefinition = ref
}

func (p *Planner) EnterField(ref int) {
	p.rootField = ref

	args := p.v.Operation.FieldArguments(ref)
	for i, arg := range args {
		if p.v.Operation.Arguments[arg].Value.Kind != ast.ValueKindVariable {
			continue
		}
		argName := string(p.v.Operation.Input.ByteSlice(p.v.Operation.Arguments[arg].Name))
		variableName := string(p.v.Operation.VariableValueNameBytes(p.v.Operation.Arguments[arg].Value.Ref))
		p.input, _ = jsonparser.Set(p.input, []byte("\""+variableName+"\""), "args", argName)
		p.input, _ = jsonparser.Set(p.input, []byte("$$"+strconv.Itoa(i)+"$$"), "variables", variableName)

		variableDefinition, ok := p.v.Operation.VariableDefinitionByNameAndOperation(p.operationDefinition, []byte(variableName))
		if !ok {
			// can't happen due to validation
			return
		}
		variableDefinitionType := p.v.Operation.VariableDefinitions[variableDefinition].Type
		renderer, err := resolve.NewJSONVariableRendererWithValidationFromTypeRef(p.v.Operation, p.v.Definition, variableDefinitionType)
		if err != nil {
			p.v.Walker.StopWithInternalErr(err)
			return
		}
		p.variables = append(p.variables, &resolve.ContextVariable{
			Path:     []string{variableName},
			Renderer: renderer,
		})
	}
}

func (p *Planner) ConfigureFetch() plan.FetchConfiguration {
	return plan.FetchConfiguration{
		Input:     string(p.input),
		Variables: p.variables,
		DataSource: &KeyValueSource{
			Operation: p.config.Operation,
			connector: p.connector,
			config:    p.config,
			kvMutex:   &sync.Mutex{},
		},
		DisallowSingleFlight: true,
		DisableDataLoader:    true,
		ProcessResponseConfig: resolve.ProcessResponseConfig{
			ExtractGraphqlResponse:    false,
			ExtractFederationEntities: false,
		},
		BatchConfig: plan.BatchConfig{
			AllowBatch: false,
		},
		SetTemplateOutputToNullOnVariableNull: false,
	}
}

func (p *Planner) ConfigureSubscription() plan.SubscriptionConfiguration {
	return plan.SubscriptionConfiguration{
		Input:     string(p.input),
		Variables: p.variables,
		DataSource: &KeyValueSource{
			Operation: p.config.Operation,
			connector: p.connector,
			config:    p.config,
			kvMutex:   &sync.Mutex{},
		},
	}
}

func (p *Planner) DataSourcePlanningBehavior() plan.DataSourcePlanningBehavior {
	return plan.DataSourcePlanningBehavior{
		MergeAliasedRootNodes:      false,
		OverrideFieldPathFromAlias: false,
		IncludeTypeNameFields:      false,
	}
}

func (p *Planner) DownstreamResponseFieldAlias(downstreamFieldRef int) (alias string, exists bool) {
	return "", false
}

type KeyValueSource struct {
	connector           *Connector
	conn                *nats.Conn
	config              Configuration
	js                  nats.JetStreamContext
	kv                  nats.KeyValue
	kvMutex             *sync.Mutex
	Operation           wgpb.NatsKvOperation
	overrideCreatedTime *int64
}

func (s *KeyValueSource) ensureKv() (err error) {
	s.kvMutex.Lock()
	defer s.kvMutex.Unlock()
	if s.kv != nil {
		return
	}
	s.conn, s.js, err = s.connector.connect(s.config)
	if err != nil {
		return
	}
	s.kv, err = s.js.KeyValue(s.config.Bucket)
	if err != nil {
		s.kv, err = s.js.CreateKeyValue(&nats.KeyValueConfig{
			Bucket:  s.config.Bucket,
			History: uint8(s.config.History),
		})
		if err != nil {
			return
		}
	}
	return
}

func (s *KeyValueSource) Start(ctx context.Context, input []byte, next chan<- []byte) error {
	if err := s.ensureKv(); err != nil {
		return err
	}
	switch s.Operation {
	case wgpb.NatsKvOperation_NATSKV_WATCH:
		return s.watch(ctx, input, next)
	case wgpb.NatsKvOperation_NATSKV_WATCHALL:
		return s.watchAll(ctx, next)
	}
	return fmt.Errorf("unknown operation %s", s.Operation.String())
}

func (s *KeyValueSource) processUpdates(ctx context.Context, watcher nats.KeyWatcher, next chan<- []byte) error {
	updates := watcher.Updates()
	done := ctx.Done()
	for {
		select {
		case <-done:
			return nil
		case update, ok := <-updates:
			if !ok {
				return nil
			}
			if update == nil {
				// initial sync complete
				continue
			}
			entry := ResponseKeyValueEntry{
				Key:      update.Key(),
				Value:    update.Value(),
				Revision: update.Revision(),
				Created:  update.Created().Unix(),
			}
			if s.overrideCreatedTime != nil {
				entry.Created = *s.overrideCreatedTime
			}
			entryBytes, err := json.Marshal(entry)
			if err != nil {
				return err
			}
			next <- entryBytes
		}
	}
}

func (s *KeyValueSource) watch(ctx context.Context, input []byte, next chan<- []byte) error {
	keyVariableName, err := jsonparser.GetString(input, "args", "keys")
	if err != nil {
		return err
	}
	keys := make([]string, 0, 1)
	_, err = jsonparser.ArrayEach(input, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		keys = append(keys, string(value))
	}, "variables", keyVariableName)
	if err != nil {
		return err
	}
	watcher, err := s.kv.Watch(strings.Join(keys, ","), nats.Context(ctx))
	if err != nil {
		return err
	}
	err = s.processUpdates(ctx, watcher, next)
	return err
}

func (s *KeyValueSource) watchAll(ctx context.Context, next chan<- []byte) error {
	watcher, err := s.kv.WatchAll(nats.Context(ctx))
	if err != nil {
		return err
	}
	err = s.processUpdates(ctx, watcher, next)
	return err
}

type ResponseKeyValueEntry struct {
	Key      string          `json:"key"`
	Value    json.RawMessage `json:"value"`
	Revision uint64          `json:"revision"`
	Created  int64           `json:"created"`
}

func (s *KeyValueSource) Load(ctx context.Context, input []byte, w io.Writer) (err error) {
	if err := s.ensureKv(); err != nil {
		return err
	}
	switch s.Operation {
	case wgpb.NatsKvOperation_NATSKV_GET:
		return s.get(input, w)
	case wgpb.NatsKvOperation_NATSKV_GETREVISION:
		return s.getRevision(input, w)
	case wgpb.NatsKvOperation_NATSKV_KEYS:
		return s.keys(w)
	case wgpb.NatsKvOperation_NATSKV_HISTORY:
		return s.history(input, w)
	case wgpb.NatsKvOperation_NATSKV_PUT:
		return s.put(input, w)
	case wgpb.NatsKvOperation_NATSKV_CREATE:
		return s.create(input, w)
	case wgpb.NatsKvOperation_NATSKV_UPDATE:
		return s.update(input, w)
	case wgpb.NatsKvOperation_NATSKV_DELETE:
		return s.delete(input, w)
	case wgpb.NatsKvOperation_NATSKV_PURGE:
		return s.purge(input, w)
	}
	return nil
}

func (s *KeyValueSource) writeResponse(key string, value []byte, revision uint64, created time.Time, w io.Writer) error {
	response := ResponseKeyValueEntry{
		Key:      key,
		Value:    value,
		Revision: revision,
		Created:  created.Unix(),
	}
	if s.overrideCreatedTime != nil {
		response.Created = *s.overrideCreatedTime
	}
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}
	_, err = w.Write(responseBytes)
	return err
}

func (s *KeyValueSource) create(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	valueVariableName, err := jsonparser.GetString(input, "args", "value")
	if err != nil {
		return err
	}
	value, _, _, err := jsonparser.Get(input, "variables", valueVariableName)
	if err != nil {
		return err
	}
	revision, err := s.kv.Create(key, value)
	if err != nil {
		if errors.Is(err, nats.ErrKeyExists) {
			_, err = w.Write([]byte("null"))
			return err
		}
		return err
	}
	return s.writeResponse(key, value, revision, time.Now(), w)
}

func (s *KeyValueSource) delete(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	err = s.kv.Delete(key) // nolint:errcheck
	if err != nil {
		_, err = w.Write([]byte("false"))
		return
	}
	_, err = w.Write([]byte("true"))
	return
}

func (s *KeyValueSource) purge(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	err = s.kv.Purge(key) // nolint:errcheck
	if err != nil {
		_, err = w.Write([]byte("false"))
		return
	}
	_, err = w.Write([]byte("true"))
	return
}

func (s *KeyValueSource) put(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	valueVariableName, err := jsonparser.GetString(input, "args", "value")
	if err != nil {
		return err
	}
	value, _, _, err := jsonparser.Get(input, "variables", valueVariableName)
	if err != nil {
		return err
	}
	revision, err := s.kv.Put(key, value)
	if err != nil {
		return err
	}
	return s.writeResponse(key, value, revision, time.Now(), w)
}

func (s *KeyValueSource) update(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	valueVariableName, err := jsonparser.GetString(input, "args", "value")
	if err != nil {
		return err
	}
	value, _, _, err := jsonparser.Get(input, "variables", valueVariableName)
	if err != nil {
		return err
	}

	revisionVariableName, err := jsonparser.GetString(input, "args", "revision")
	if err != nil {
		return err
	}
	revision, err := jsonparser.GetInt(input, "variables", revisionVariableName)
	if err != nil {
		return err
	}

	revisionResult, err := s.kv.Update(key, value, uint64(revision))
	if err != nil {
		return err
	}
	return s.writeResponse(key, value, revisionResult, time.Now(), w)
}

func (s *KeyValueSource) get(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	entry, err := s.kv.Get(key)
	if err != nil {
		if errors.Is(err, nats.ErrKeyNotFound) {
			_, err = w.Write([]byte("null"))
			return
		}
		return err
	}
	if entry == nil {
		_, err = w.Write([]byte("null"))
		return
	}
	return s.writeResponse(key, entry.Value(), entry.Revision(), entry.Created(), w)
}

func (s *KeyValueSource) getRevision(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	revisionVariableName, err := jsonparser.GetString(input, "args", "revision")
	if err != nil {
		return err
	}
	revision, err := jsonparser.GetInt(input, "variables", revisionVariableName)
	if err != nil {
		return err
	}
	entry, err := s.kv.GetRevision(key, uint64(revision))
	if err != nil {
		if errors.Is(err, nats.ErrKeyNotFound) {
			_, err = w.Write([]byte("null"))
			return
		}
		return err
	}
	if entry == nil {
		_, err = w.Write([]byte("null"))
		return
	}
	return s.writeResponse(key, entry.Value(), entry.Revision(), entry.Created(), w)
}

func (s *KeyValueSource) keys(w io.Writer) (err error) {
	keys, err := s.kv.Keys()
	if err != nil {
		if errors.Is(err, nats.ErrNoKeysFound) {
			_, err = w.Write([]byte("[]"))
			return err
		}
		return err
	}

	if keys == nil {
		_, err = w.Write([]byte("[]"))
		return err
	}

	bytes, err := json.Marshal(keys)
	if err != nil {
		return err
	}

	_, err = w.Write(bytes)
	return err
}

func (s *KeyValueSource) history(input []byte, w io.Writer) (err error) {
	keyVariableName, err := jsonparser.GetString(input, "args", "key")
	if err != nil {
		return err
	}
	key, err := jsonparser.GetString(input, "variables", keyVariableName)
	if err != nil {
		return err
	}
	entries, err := s.kv.History(key)
	if err != nil {
		if errors.Is(err, nats.ErrKeyNotFound) {
			_, err = w.Write([]byte("[]"))
			return
		}
		return err
	}
	if entries == nil {
		_, err = w.Write([]byte("[]"))
		return
	}

	responseEntries := make([]ResponseKeyValueEntry, 0, len(entries))
	for _, entry := range entries {
		response := ResponseKeyValueEntry{
			Key:      key,
			Revision: entry.Revision(),
			Created:  entry.Created().Unix(),
		}
		if s.overrideCreatedTime != nil {
			response.Created = *s.overrideCreatedTime
		}

		if len(entry.Value()) > 0 {
			response.Value = entry.Value()
		} else {
			response.Value = []byte("null")
		}

		responseEntries = append(responseEntries, response)
	}

	responseBytes, err := json.Marshal(responseEntries)
	if err != nil {
		return err
	}
	_, err = w.Write(responseBytes)
	return err
}
