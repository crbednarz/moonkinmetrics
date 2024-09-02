package talents

import (
	_ "embed"
	"fmt"
)

func MockSpellMediaJson(id string) string {
	return fmt.Sprintf(`{
    "assets": [
      {
        "key": "icon",
        "value": "%s"
      }
    ],
    "id": %s
  }`, id, id)
}
