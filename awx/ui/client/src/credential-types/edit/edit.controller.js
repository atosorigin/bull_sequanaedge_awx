/*************************************************
 * Copyright (c) 2015 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

export default ['Rest', 'Wait',
    'CredentialTypesForm', 'ProcessErrors', 'GetBasePath',
    'GenerateForm', 'credential_typeData',
    '$scope', '$state', 'GetChoices', 'ParseTypeChange', 'ToJSON', 'ParseVariableString', 'CreateSelect2',
    function(
        Rest, Wait, CredentialTypesForm, ProcessErrors, GetBasePath,
        GenerateForm, credential_typeData,
        $scope, $state, GetChoices, ParseTypeChange, ToJSON, ParseVariableString, CreateSelect2
    ) {
        var generator = GenerateForm,
            data = credential_typeData,
            id = credential_typeData.id,
            form = CredentialTypesForm,
            master = {},
            url = GetBasePath('credential_types');

        init();

        function init() {
            // Load the list of options for Kind
            GetChoices({
                scope: $scope,
                url: url,
                field: 'kind',
                variable: 'credential_kind_options',
                callback: 'choicesReadyCredentialTypes'
            });
        }

        if ($scope.removeChoicesReady) {
            $scope.removeChoicesReady();
        }
        $scope.removeChoicesReady = $scope.$on('choicesReadyCredentialTypes',
            function() {
                $scope.credential_type = credential_typeData;

                $scope.$watch('credential_type.summary_fields.user_capabilities.edit', function(val) {
                    if (val === false) {
                        $scope.canAdd = false;
                    }
                });

                function getVars(str){

                    // Quick function to test if the host vars are a json-object-string,
                    // by testing if they can be converted to a JSON object w/o error.
                    function IsJsonString(str) {
                        try {
                            JSON.parse(str);
                        } catch (e) {
                            return false;
                        }
                        return true;
                    }

                    if(str === ''){
                        return '---';
                    }
                    else if(IsJsonString(str)){
                        str = JSON.parse(str);
                        return jsyaml.safeDump(str);
                    }
                    else if(!IsJsonString(str)){
                        return str;
                    }
                }

                var fld, i;
                for (fld in form.fields) {
                    if (data[fld]  && fld !== 'inputs' || fld !== 'injectors') {
                        $scope[fld] = data[fld];
                        master[fld] = data[fld];
                    }

                    if (fld === "kind") {
                        // Set kind field to the correct option
                        for (i = 0; i < $scope.credential_kind_options.length; i++) {
                            if ($scope.kind === $scope.credential_kind_options[i].value) {
                                $scope.kind = $scope.credential_kind_options[i];
                                master[fld] = $scope.credential_kind_options[i];
                                break;
                            }
                        }
                    }
                }

                $scope.inputs = ParseVariableString(getVars(data.inputs));
                $scope.injectors = ParseVariableString(getVars(data.injectors));

                // if ($scope.inputs === "{}") {
                //     $scope.inputs = "---";
                // }
                //
                // if ($scope.injectors === "{}") {
                //     $scope.injectors = "---";
                // }

                // $scope.inputs = JSON.parse($scope.inputs);
                // $scope.injectors = JSON.parse($scope.injectors);

                var callback = function() {
                    // Make sure the form controller knows there was a change
                    $scope[form.name + '_form'].$setDirty();
                };
                $scope.parseTypeInputs = 'yaml';
                $scope.parseTypeInjectors = 'yaml';

                ParseTypeChange({
                    scope: $scope,
                    field_id: 'credential_type_inputs',
                    variable: 'inputs',
                    onChange: callback,
                    parse_variable: 'parseTypeInputs'
                });
                ParseTypeChange({
                    scope: $scope,
                    field_id: 'credential_type_injectors',
                    variable: 'injectors',
                    onChange: callback,
                    parse_variable: 'parseTypeInjectors'
                });

                CreateSelect2({
                    element: '#credential_type_kind',
                    multiple: false,
                });
            }
        );

        $scope.formSave = function() {
            generator.clearApiErrors($scope);
            Wait('start');
            Rest.setUrl(url + id + '/');
            var inputs = ToJSON($scope.parseTypeInputs, $scope.inputs);
            var injectors = ToJSON($scope.parseTypeInjectors, $scope.injectors);
            if (inputs === null) {
              inputs = {};
            }
            if (injectors === null) {
              injectors = {};
            }
            Rest.put({
                    name: $scope.name,
                    description: $scope.description,
                    kind: $scope.kind.value,
                    inputs: inputs,
                    injectors: injectors
                })
                .success(function() {
                    $state.go($state.current, null, { reload: true });
                    Wait('stop');
                })
                .error(function(data, status) {
                    ProcessErrors($scope, data, status, form, {
                        hdr: 'Error!',
                        msg: 'Failed to add new credential type. PUT returned status: ' + status
                    });
                });
        };

        $scope.formCancel = function() {
            $state.go('credentialTypes');
        };

    }
];
