// Angular imports
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
// App imports
import { AzureInstanceType } from 'src/app/swagger/models';
import { AzureNodeSettingStandaloneStepMapping, AzureNodeSettingStepMapping } from './node-setting-step.fieldmapping';
import AppServices from '../../../../shared/service/appServices';
import { FieldMapUtilities } from '../../wizard/shared/field-mapping/FieldMapUtilities';
import { StepFormDirective } from '../../wizard/shared/step-form/step-form';
import { StepMapping } from '../../wizard/shared/field-mapping/FieldMapping';
import { TanzuEventType } from '../../../../shared/service/Messenger';
import { ValidationService } from '../../wizard/shared/validation/validation.service';
import { ClusterPlan } from '../../wizard/shared/constants/wizard.constants';
import { AzureField } from '../azure-wizard.constants';

@Component({
    selector: 'app-node-setting-step',
    templateUrl: './node-setting-step.component.html',
    styleUrls: ['./node-setting-step.component.scss']
})
export class NodeSettingStepComponent extends StepFormDirective implements OnInit {

    nodeTypes: AzureInstanceType[] = [];
    clusterPlan: string;
    currentRegion = 'US-WEST';
    displayForm = false;

    constructor(private validationService: ValidationService,
                private fieldMapUtilities: FieldMapUtilities) {
        super();
        this.nodeTypes = [];
    }

    private supplyStepMapping(): StepMapping {
        const fieldMappings = this.modeClusterStandalone ? AzureNodeSettingStandaloneStepMapping : AzureNodeSettingStepMapping;
        FieldMapUtilities.getFieldMapping(AzureField.NODESETTING_MANAGEMENT_CLUSTER_NAME, fieldMappings).required =
            AppServices.appDataService.isClusterNameRequired();
        return fieldMappings;
    }

    private subscribeToServices() {
        AppServices.dataServiceRegistrar.stepSubscribe(this,
            TanzuEventType.AZURE_GET_INSTANCE_TYPES, this.onFetchedInstanceTypes.bind(this))
    }

    private onFetchedInstanceTypes(instanceTypes: AzureInstanceType[]) {
        this.nodeTypes = instanceTypes.sort();
        if (!this.modeClusterStandalone && this.nodeTypes.length === 1) {
            this.formGroup.get(AzureField.NODESETTING_WORKERTYPE).setValue(this.nodeTypes[0].name);
        }
    }

    listenOnChangeClusterPlan() {
        setTimeout(_ => {
            this.displayForm = true;
            const controlPlaneSettingControl = this.formGroup.get(AzureField.NODESETTING_CONTROL_PLANE_SETTING);
            if (controlPlaneSettingControl) {
                controlPlaneSettingControl.valueChanges.subscribe(data => {
                    if (data === ClusterPlan.DEV) {
                        this.setDevCardValidations();
                    } else if (data === ClusterPlan.PROD) {
                        this.setProdCardValidations();
                    }
                });
            } else {
                console.log('WARNING: azure-wizard.node-setting-step.listenOnChangeClusterPlan() cannot find controlPlaneSettingControl!');
            }
        });
    }

    setDevCardValidations() {
        this.clusterPlan = ClusterPlan.DEV;
        this.formGroup.markAsPending();
        this.resurrectField(
            AzureField.NODESETTING_INSTANCE_TYPE_DEV,
            [Validators.required],
            this.nodeTypes.length === 1 ? this.nodeTypes[0].name : '',
            { onlySelf: true, emitEvent: false }
        );
        this.disarmField(AzureField.NODESETTING_INSTANCE_TYPE_PROD, true);
    }

    setProdCardValidations() {
        this.clusterPlan = ClusterPlan.PROD;
        this.disarmField(AzureField.NODESETTING_INSTANCE_TYPE_DEV, true);
        this.formGroup.markAsPending();
        this.resurrectField(
            AzureField.NODESETTING_INSTANCE_TYPE_PROD,
            [Validators.required],
            this.nodeTypes.length === 1 ? this.nodeTypes[0].name : '',
            { onlySelf: true, emitEvent: false }
        );
    }

    ngOnInit() {
        super.ngOnInit();
        this.fieldMapUtilities.buildForm(this.formGroup, this.formName, this.supplyStepMapping());
        this.subscribeToServices();
        this.registerStepDescriptionTriggers({ clusterTypeDescriptor: true, fields: [AzureField.NODESETTING_CONTROL_PLANE_SETTING]});
        this.listenOnChangeClusterPlan();
        this.initFormWithSavedData();
    }

    initFormWithSavedData() {
        const isProdClusterPlan = this.getSavedValue(AzureField.NODESETTING_INSTANCE_TYPE_DEV, '') === '';
        this.cardClick(isProdClusterPlan ? ClusterPlan.PROD : ClusterPlan.DEV);

        super.initFormWithSavedData();
        // because it's in its own component, the enable audit logging field does not get initialized in the above call to
        // super.initFormWithSavedData()
        setTimeout( () => {
            this.setControlWithSavedValue(AzureField.NODESETTING_ENABLE_AUDIT_LOGGING, false);
        })
    }

    cardClick(envType: string) {
        this.setControlValueSafely(AzureField.NODESETTING_CONTROL_PLANE_SETTING, envType);
    }

    getEnvType(): string {
        return this.formGroup.controls[AzureField.NODESETTING_CONTROL_PLANE_SETTING].value;
    }

    dynamicDescription(): string {
        if (this.clusterPlan) {
            return 'Control plane type: ' + this.clusterPlan;
        }
        return 'Specify the resources backing the ' + this.clusterTypeDescriptor + ' cluster';
    }
}
