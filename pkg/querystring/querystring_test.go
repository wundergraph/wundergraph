package querystring

import (
	"testing"
)

func TestToJSONNested(t *testing.T) {
	query := "bar%5Bone%5D%5Btwo%5D=2&bar[one][red]=112"
	expected := `{"bar":{"one":{"red":112,"two":2}}}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONPlain(t *testing.T) {
	query := "cat=1&dog=2"
	expected := `{"cat":1,"dog":2}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONSlice(t *testing.T) {
	query := "cat[]=1&cat[]=34"
	expected := `{"cat":[1,34]}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONSliceOne(t *testing.T) {
	query := "cat[]=1"
	expected := `{"cat":[1]}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONBig(t *testing.T) {
	query := "distinct_id=763_1495187301909_3495&timestamp=1495187523&event=product_add_cart&params%5BproductRefId%5D=8284563078&params%5Bapps%5D%5B%5D=precommend&params%5Bapps%5D%5B%5D=bsales&params%5Bsource%5D=item&params%5Boptions%5D%5Bsegment%5D=cart_recommendation&params%5Boptions%5D%5Btype%5D=up_sell&params%5BtimeExpire%5D=1495187599642&params%5Brecommend_system_product_source%5D=item&params%5Bproduct_id%5D=8284563078&params%5Bvariant_id%5D=27661944134&params%5Bsku%5D=00483332%20(black)&params%5Bsources%5D%5B%5D=product_recommendation&params%5Bcart_token%5D=dc2c336a009edf2762128e65806dfb1d&params%5Bquantity%5D=1&params%5Bnew_popup_upsell_mobile%5D=false&params%5BclientDevice%5D=desktop&params%5BclientIsMobile%5D=false&params%5BclientIsSmallScreen%5D=false&params%5Bnew_popup_crossell_mobile%5D=false&api_key=14c5b7dacea9157029265b174491d340"
	expected := `{"api_key":"14c5b7dacea9157029265b174491d340","distinct_id":"763_1495187301909_3495","event":"product_add_cart","params":{"apps":["precommend","bsales"],"cart_token":"dc2c336a009edf2762128e65806dfb1d","clientDevice":"desktop","clientIsMobile":false,"clientIsSmallScreen":false,"new_popup_crossell_mobile":false,"new_popup_upsell_mobile":false,"options":{"segment":"cart_recommendation","type":"up_sell"},"productRefId":8284563078,"product_id":8284563078,"quantity":1,"recommend_system_product_source":"item","sku":"00483332 (black)","source":"item","sources":["product_recommendation"],"timeExpire":1495187599642,"variant_id":27661944134},"timestamp":1495187523}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONDuplicateKey(t *testing.T) {
	query := "cat=1&cat=2"
	expected := `{"cat":2}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONWGVariables(t *testing.T) {
	// variables: {"cat":2}
	query := "wg_variables=%7B%22cat%22%3A2%7D"
	expected := `{"cat":2}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}

func TestToJSONNoQuery(t *testing.T) {
	// variables: {"cat":2}
	query := ""
	expected := `{}`
	actual, err := ToJSON(query)
	if err != nil {
		t.Error(err)
	}
	actualStr := string(actual)
	if actualStr != expected {
		t.Errorf("Expected: %s Actual: %s", expected, actualStr)
	}
}
