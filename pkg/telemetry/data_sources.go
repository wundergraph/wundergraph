package telemetry

import (
	"encoding/json"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"

	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	urlHashTag = "urlHash"
)

func dataSourceMetric(dataSourceName string, urlVariable *wgpb.ConfigurationVariable) (*Metric, error) {
	metric := NewDataSourceMetric(dataSourceName)
	if urlVariable != nil {
		urlValue := loadvariable.String(urlVariable)
		if urlValue != "" {
			urlHash, err := Hash(urlValue)
			if err != nil {
				return nil, err
			}
			if err := metric.AddTag(urlHashTag, urlHash); err != nil {
				return nil, err
			}
			if u, err := url.Parse(urlValue); err == nil {
				// Try to parse as host:port, fallback to host
				host, _, _ := net.SplitHostPort(u.Host)
				if host == "" {
					host = u.Host
				}
				if host == "localhost" {
					if err := metric.AddTag("localhost", "true"); err != nil {
						return nil, err
					}
				}
			}
		}
	}
	return metric, nil
}

func DataSourceMetrics(wunderGraphDir string) ([]*Metric, error) {
	configFile := filepath.Join(wunderGraphDir, "generated", "wundergraph.config.json")
	f, err := os.Open(configFile)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	dec := json.NewDecoder(f)
	var wgConfig wgpb.WunderGraphConfiguration
	if err := dec.Decode(&wgConfig); err != nil {
		return nil, err
	}
	var metrics []*Metric
	for _, ds := range wgConfig.GetApi().GetEngineConfiguration().GetDatasourceConfigurations() {
		var dataSourceName string
		var urlVariable *wgpb.ConfigurationVariable
		switch ds.Kind {
		case wgpb.DataSourceKind_STATIC:
			// Not reported
		case wgpb.DataSourceKind_REST:
			dataSourceName = ds.Kind.String()
			urlVariable = ds.GetCustomRest().GetFetch().GetUrl()
		case wgpb.DataSourceKind_GRAPHQL:
			dataSourceName = ds.Kind.String()
			urlVariable = ds.GetCustomGraphql().GetFetch().GetUrl()
		case wgpb.DataSourceKind_POSTGRESQL,
			wgpb.DataSourceKind_MYSQL,
			wgpb.DataSourceKind_SQLSERVER,
			wgpb.DataSourceKind_MONGODB,
			wgpb.DataSourceKind_SQLITE:

			dataSourceName = ds.Kind.String()
			urlVariable = ds.CustomDatabase.GetDatabaseURL()
		default:
			if err != nil {
				return nil, fmt.Errorf("unhandled data source kind %v", ds.Kind)
			}
		}
		if dataSourceName == "" {
			continue
		}
		metric, err := dataSourceMetric(dataSourceName, urlVariable)
		if err != nil {
			return nil, err
		}
		// Same underlying data source can be included multiple times, deduplicate
		found := false
		for _, m := range metrics {
			if m.Equal(metric) {
				found = true
				break
			}
		}
		if !found {
			metrics = append(metrics, metric)
		}
	}

	return metrics, nil
}
