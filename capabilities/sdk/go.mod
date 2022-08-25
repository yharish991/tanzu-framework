module github.com/vmware-tanzu/tanzu-framework/capabilities/sdk

go 1.17

replace (
	github.com/vmware-tanzu/tanzu-framework => ../../
	github.com/vmware-tanzu/tanzu-framework/apis/cli => ../../apis/cli
	github.com/vmware-tanzu/tanzu-framework/apis/config => ../../apis/config
	k8s.io/api => k8s.io/api v0.23.5
	k8s.io/apimachinery => k8s.io/apimachinery v0.23.5
	k8s.io/client-go => k8s.io/client-go v0.23.5
	sigs.k8s.io/cluster-api => sigs.k8s.io/cluster-api v1.1.5
)

require (
	github.com/vmware-tanzu/tanzu-framework v0.25.0
	gopkg.in/yaml.v3 v3.0.1
	k8s.io/api v0.23.5
	k8s.io/apimachinery v0.23.5
	k8s.io/client-go v0.23.5
	sigs.k8s.io/cluster-api v1.1.5
	sigs.k8s.io/controller-runtime v0.11.2
)
