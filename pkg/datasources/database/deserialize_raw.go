package database

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"github.com/buger/jsonparser"
	"strconv"
	"time"

	"github.com/shopspring/decimal"
)

type PrismaType string

const (
	Int      PrismaType = "int"
	BigInt   PrismaType = "bigint"
	Float    PrismaType = "float"
	Double   PrismaType = "double"
	String   PrismaType = "string"
	Enum     PrismaType = "enum"
	Bytes    PrismaType = "bytes"
	Bool     PrismaType = "bool"
	Char     PrismaType = "char"
	Decimal  PrismaType = "decimal"
	JSON     PrismaType = "json"
	XML      PrismaType = "xml"
	UUID     PrismaType = "uuid"
	Datetime PrismaType = "datetime"
	Date     PrismaType = "date"
	Time     PrismaType = "time"
	Array    PrismaType = "array"
	Null     PrismaType = "null"
)

type TypedValue struct {
	PrismaType  PrismaType  `json:"prisma__type"`
	PrismaValue interface{} `json:"prisma__value"`
}

func deserializeValue(value TypedValue) interface{} {
	switch value.PrismaType {
	case BigInt:
		if str, ok := value.PrismaValue.(string); ok {
			if i, err := strconv.ParseInt(str, 10, 64); err == nil {
				return i
			}
		}

	case Bytes:
		if str, ok := value.PrismaValue.(string); ok {
			if data, err := base64.StdEncoding.DecodeString(str); err == nil {
				return data
			}
		}

	case Decimal:
		if str, ok := value.PrismaValue.(string); ok {
			if dec, err := decimal.NewFromString(str); err == nil {
				return dec
			}
		}

	case Datetime, Date:
		if str, ok := value.PrismaValue.(string); ok {
			if t, err := time.Parse(time.RFC3339, str); err == nil {
				return t
			}
		}

	case Time:
		if str, ok := value.PrismaValue.(string); ok {
			if t, err := time.Parse("15:04:05", str); err == nil {
				return t
			}
		}

	case Array:
		if arr, ok := value.PrismaValue.([]TypedValue); ok {
			var deserialized []interface{}
			for _, v := range arr {
				deserialized = append(deserialized, deserializeValue(v))
			}
			return deserialized
		}

	default:
		return value.PrismaValue
	}

	return nil
}

func deserializeRawResults(rows []map[string]TypedValue) []map[string]interface{} {
	var mappedRows []map[string]interface{}
	for _, row := range rows {
		mappedRow := make(map[string]interface{})
		for key, value := range row {
			mappedRow[key] = deserializeValue(value)
		}
		mappedRows = append(mappedRows, mappedRow)
	}
	return mappedRows
}

func DeserializeRawResponse(response *bytes.Buffer) (*bytes.Buffer, error) {
	jsonData := response.Bytes()
	var responseRows bytes.Buffer

	err := jsonparser.ObjectEach(jsonData, func(key []byte, value []byte, dataType jsonparser.ValueType, offset int) error {
		var rowRawData []map[string]TypedValue

		err := json.Unmarshal(value, &rowRawData)
		if err != nil {
			return err
		}

		rowKey := string(key)
		rowData := deserializeRawResults(rowRawData)
		rowMap := map[string]interface{}{
			rowKey: rowData,
		}

		rowJSON, err := json.Marshal(rowMap)
		if err != nil {
			return err
		}

		responseRows.Write(rowJSON)
		responseRows.WriteByte(',')

		return nil
	}, "data")

	if err != nil {
		return nil, err
	}

	if responseRows.Len() > 0 {
		responseRows.Truncate(responseRows.Len() - 1)
	}

	finalResponse := bytes.NewBufferString(`{"data":`)
	finalResponse.Write(responseRows.Bytes())
	finalResponse.WriteString(`}`)

	return finalResponse, nil
}
