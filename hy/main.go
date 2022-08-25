package main

import (
	"fmt"
	"github.com/vmware-tanzu/tanzu-framework/capabilities/sdk"
	"sigs.k8s.io/controller-runtime/pkg/client/config"
)

func main() {
	cfg, _ := config.GetConfig()

	clusterQueryClient, err := sdk.NewClusterQueryClientForConfig(cfg)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(clusterQueryClient)
}