title: WunderGraph Example

Client -> WunderGraph Server: Request

note:
HTTP GET

/operations/Weather?continent=Europe

WunderGraph Server -> WunderGraph Server: Validate Authentication

if: user is unauthenticated

WunderGraph Server -> Client: Response

note: 401 Unauthorized

end

WunderGraph Server -> WunderGraph Server: Validate Authorization

if: user is unauthorized

WunderGraph Server -> Client: Response

note: 401 Unauthorized

end

WunderGraph Server -> WunderGraph Server: JSON-Schema Input Validation

group: invalid input

WunderGraph Server -> Client: Response

note: 400 Bad Request

end

WunderGraph Server -> Countries API: Request

note:
HTTP POST

```
query ($continent: String!) {
	countries(
  	filter:{
    	continent:{eq:$continent}}
  )
  {
  	code
    name
    capital
  }
}

{
	"variables":{
		"continent":"Europe"
  }
}
```

Countries API -> WunderGraph Server: Response

note:

```
{
	"countries": [
  	{
			"code":"DE",
			"name":"Germany",
			"capital":"Berlin"
  	}
	]
}
```

WunderGraph Server -> WunderGraph Server: Response Mapping

if: repeat for each object in the countries Array

WunderGraph Server -> Weather API: Request

note:
HTTP POST

```
query ($capital: String!) getCityByName(name: $capital){
	weather {
		temperature {
		max
	}
	summary {
		title
		description
	}
}

{
	"variables":{
		"capital":"Berlin"
  }
}
```

Weather API -> WunderGraph Server: Response

note:

```
{
	"weather_getCityByName": {
		"weather": {
			"temperature": {
				"max": 272.24
			},
    },
		"summary": {
			"title": "Snow",
			"description": "light snow"
		}
	}
}
```

WunderGraph Server -> WunderGraph Server: Response Mapping

WunderGraph Server -> WunderGraph Server: Join Data

end

WunderGraph Server -> WunderGraph Server: Postprocessing

note:

- rename "countries_countries" to "countries"
- rename "\_join" to "weather"
- remove nesting of "weather_getCityByName"

WunderGraph Server -> Client: Response

note:
200 OK

```
{
  "data": {
    "countries": [
      {
        "code": "AD",
        "name": "Andorra",
        "capital": "Andorra la Vella",
        "weather": {
        	"temperature": {
          	"max": 272.24
          },
          "summary": {
          	"title": "Snow",
            "description": "light snow"
          }
        }
      }
    }
  }
}
```
