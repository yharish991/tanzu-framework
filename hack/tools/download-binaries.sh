#!/usr/bin/env bash

set -eoux pipefail


PROJECT_ROOT=$(git rev-parse --show-toplevel)
TOOLS_DIR="${PROJECT_ROOT}/hack/tools"
TOOLS_BIN_DIR="${TOOLS_DIR}/bin"
TKG_BUILD_INFO_FILE_PATH="${TOOLS_DIR}/tkg-build-info.yaml"

function download_file_from_url() {
    local download_link=$1
    local http_code

    echo "Downloading ${download_link}"
    http_code=$(curl -s -o /dev/null -I -w "%{http_code}" "${download_link}")
    if [[ ${http_code} != "200" ]]
    then
      echo "The file at ${download_link} does not exist"
      exit 1
    fi

    file_path="./$(basename "${download_link}")"
    curl -s -L -o "${file_path}" "${download_link}"
}


function download_binary() {
    tmp_dir=$(mktemp -d)
    pushd "${tmp_dir}"
    name=${1}
    # ytt is named as k14s_ytt
    if [ "${1}" == 'ytt' ]
    then
        name='k14s_ytt'
    fi
    # kapp is named as k14s_kapp
    if [ "${1}" == 'kapp' ]
    then
        name='k14s_kapp'
    fi

    cli_download_link=$(${TOOLS_BIN_DIR}/yq e '.componentBuilds.[] | select(.name == "'"${name}"'").artifactURL.'"${1}"'-'"${2}"'.url' "${TKG_BUILD_INFO_FILE_PATH}")
    download_file_from_url "${cli_download_link}"
    gunzip "${1}"-*.gz
    mv "${1}"* "${TOOLS_BIN_DIR}/${1}"
    chmod +x "${TOOLS_BIN_DIR}/${1}"
    popd
}

"$@"
