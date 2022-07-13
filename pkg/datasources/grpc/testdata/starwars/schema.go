package starwars

import (
	"io/ioutil"
	"path"

	"github.com/stretchr/testify/require"
)

const GrpcGeneratedSchema = `
type Query {
  starwars_StarwarsService_GetHero(input: starwars_GetHeroRequest_Input): starwars_Character
  starwars_StarwarsService_GetHuman(input: starwars_GetHumanRequest_Input): starwars_Character
  starwars_StarwarsService_GetDroid(input: starwars_GetDroidRequest_Input): starwars_Character
  starwars_StarwarsService_ListHumans(input: starwars_ListEmptyRequest_Input): starwars_ListHumansResponse
  starwars_StarwarsService_ListDroids(input: starwars_ListEmptyRequest_Input): starwars_ListDroidsResponse
  starwars_StarwarsService_connectivityState(tryToConnect: Boolean): ConnectivityState
}

type starwars_Character {
  id: String
  name: String
  friends: [starwars_Character]
  appears_in: [starwars_Episode]
  home_planet: String
  primary_function: String
  type: starwars_Type
}

enum starwars_Episode {
  _
  NEWHOPE
  EMPIRE
  JEDI
}

enum starwars_Type {
  HUMAN
  DROID
}

input starwars_GetHeroRequest_Input {
  episode: starwars_Episode
}

input starwars_GetHumanRequest_Input {
  id: String
}

input starwars_GetDroidRequest_Input {
  id: String
}

type starwars_ListHumansResponse {
  humans: [starwars_Character]
}

scalar starwars_ListEmptyRequest_Input @specifiedBy(url: "http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf")

type starwars_ListDroidsResponse {
  droids: [starwars_Character]
}

enum ConnectivityState {
  IDLE
  CONNECTING
  READY
  TRANSIENT_FAILURE
  SHUTDOWN
}
`

func ProtoSet(t require.TestingT, relativePath string) []byte {
	protosetPath := path.Join(relativePath, "starwars.protoset")
	protoset, err := ioutil.ReadFile(protosetPath)
	require.NoError(t, err)
	return protoset
}
