package testdata

import (
	"bytes"
	"io"
)

const testData = `
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      },
      "mutationType": {
        "name": "Mutation"
      },
      "subscriptionType": {
        "name": "Subscription"
      }
    }
  }
}
`

func GetUploadData() io.Reader {
	return bytes.NewReader([]byte(testData))
}
