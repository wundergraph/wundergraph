/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * See LICENSE.COMMUNITY.md
 */
package hooks

import "github.com/wundergraph/wundergraph/pkg/wgpb"

type HookMatcher struct {
	OperationType wgpb.OperationType
	DataSources   []string
}

func (m *HookMatcher) containsDataSource(dataSourceID string) bool {
	for _, ds := range m.DataSources {
		if ds == dataSourceID {
			return true
		}
	}
	return false
}

// Hook contains a new-style hook that can match on arbitrary events.
// To use the hook create an Executor by calling Hook.Executor()
type Hook struct {
	ID      string
	Type    wgpb.HookType
	Matcher HookMatcher
}

type HookCheck struct {
	OperationType wgpb.OperationType
	DataSourceID  string
}

func (h *Hook) Executor() Executor {
	return &hookExecutor{
		matcher: h.Matcher,
		id:      h.ID,
	}
}

type hookExecutor struct {
	matcher HookMatcher
	id      string
}

func (e *hookExecutor) Matches(check *HookCheck) bool {
	if check.OperationType != wgpb.OperationType_INVALID && e.matcher.OperationType != wgpb.OperationType_INVALID && e.matcher.OperationType != check.OperationType {
		return false
	}
	if len(check.DataSourceID) > 0 && len(e.matcher.DataSources) > 0 && !e.matcher.containsDataSource(check.DataSourceID) {
		return false
	}
	return true
}

func (e *hookExecutor) HookID() string {
	return e.id
}

type Executor interface {
	Matches(check *HookCheck) bool
	HookID() string
}
