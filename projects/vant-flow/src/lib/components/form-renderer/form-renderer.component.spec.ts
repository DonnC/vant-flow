import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormRendererComponent } from './form-renderer.component';
import { FormContext } from '../../services/form-context';
import { AppUtilityService } from '../../services/app-utility.service';
import { signal } from '@angular/core';

describe('FormRendererComponent', () => {
    let component: FormRendererComponent;
    let fixture: ComponentFixture<FormRendererComponent>;
    let mockFormContext: jasmine.SpyObj<FormContext>;
    let mockUtils: jasmine.SpyObj<AppUtilityService>;

    beforeEach(async () => {
        mockFormContext = jasmine.createSpyObj('FormContext', [
            'getFieldSignal', 'getSectionSignal', 'isReadOnly', 'set_section_property',
            'dynamicIntro', 'customButtons', 'actionsConfig', 'initialize', 'execute',
            'trigger', 'triggerChange', 'destroy', 'set_df_property'
        ]);

        mockFormContext.getFieldSignal.and.returnValue(signal(false));
        mockFormContext.getSectionSignal.and.returnValue(signal(false));
        mockFormContext.isReadOnly.and.returnValue(false);
        mockFormContext.dynamicIntro.and.returnValue(null);
        mockFormContext.customButtons.and.returnValue([]);
        mockFormContext.actionsConfig.and.returnValue({ submit: { label: 'Submit', visible: true } });
        mockFormContext.trigger.and.returnValue(true);
        mockFormContext.execute.and.stub();

        mockUtils = jasmine.createSpyObj('AppUtilityService', [
            'show_alert', 'getDeepValue', 'setDeepValue'
        ]);
        mockUtils.getDeepValue.and.returnValue(undefined);

        await TestBed.configureTestingModule({
            imports: [FormRendererComponent],
            providers: [
                { provide: FormContext, useValue: mockFormContext },
                { provide: AppUtilityService, useValue: mockUtils }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FormRendererComponent);
        component = fixture.componentInstance;

        // Provide a minimal valid document
        component.document = {
            name: 'Test Form',
            sections: []
        };
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize FormContext on ngOnInit', () => {
        fixture.detectChanges();
        expect(mockFormContext.initialize).toHaveBeenCalled();
    });

    it('should trigger refresh script on init', () => {
        fixture.detectChanges();
        expect(mockFormContext.trigger).toHaveBeenCalledWith('refresh');
    });

    describe('packData() — Data Groups', () => {
        it('should pack fields into nested objects based on data_group', () => {
            component.document = {
                name: 'Test',
                sections: [{
                    id: 's1',
                    columns: [{
                        id: 'c1',
                        fields: [
                            { id: 'f1', fieldtype: 'Data', fieldname: 'first_name', label: 'First', data_group: 'user' },
                            { id: 'f2', fieldtype: 'Data', fieldname: 'age', label: 'Age', data_group: 'user.details' },
                            { id: 'f3', fieldtype: 'Data', fieldname: 'city', label: 'City' }
                        ]
                    }]
                }]
            };
            component.formData = { first_name: 'John', age: 30, city: 'Harare' };

            // Mock setDeepValue to actually set deep paths
            mockUtils.setDeepValue.and.callFake((obj: any, path: string, val: any) => {
                const parts = path.split('.');
                let cur = obj;
                for (let i = 0; i < parts.length - 1; i++) {
                    cur[parts[i]] = cur[parts[i]] || {};
                    cur = cur[parts[i]];
                }
                cur[parts[parts.length - 1]] = val;
            });

            mockFormContext.trigger.and.returnValue(true);

            let emitted: any;
            component.formSubmit.subscribe(d => emitted = d);

            component.submit();

            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'user.first_name', 'John');
            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'user.details.age', 30);
            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'city', 'Harare');
        });
    });

    describe('onFieldChange()', () => {
        it('should call triggerChange with fieldname and value', () => {
            component.document = { name: 'Test', sections: [] };
            fixture.detectChanges();

            component.formData['name'] = 'Alice';
            component.onFieldChange('name');

            expect(mockFormContext.triggerChange).toHaveBeenCalledWith('name', 'Alice');
        });
    });

    describe('toggleSection()', () => {
        it('should toggle collapsed state via set_section_property', () => {
            // Return false (not collapsed) as current state
            const collapsedSignal = signal(false);
            mockFormContext.getSectionSignal.and.callFake((id, prop) => {
                if (prop === 'collapsed') return collapsedSignal;
                return signal(false);
            });

            component.toggleSection('s1');

            expect(mockFormContext.set_section_property).toHaveBeenCalledWith('s1', 'collapsed', true);
        });
    });

    describe('validateForm()', () => {
        it('should return false and show alert when mandatory field is empty', () => {
            component.document = {
                name: 'Test',
                sections: [{
                    id: 's1', columns: [{
                        id: 'c1', fields: [
                            { id: 'f1', fieldtype: 'Data', fieldname: 'name', label: 'Name', mandatory: true }
                        ]
                    }]
                }]
            };

            mockFormContext.getFieldSignal.and.returnValue(signal(false)); // hidden = false
            mockFormContext.getSectionSignal.and.returnValue(signal(false)); // hidden = false

            // Spy mandatory signal
            const mandatorySignal = signal(true);
            mockFormContext.getFieldSignal.and.callFake((fn: string, prop: string) => {
                if (prop === 'mandatory') return mandatorySignal;
                return signal(false);
            });

            component.formData = { name: '' };
            fixture.detectChanges();

            const result = component.validateForm();
            expect(result).toBeFalse();
            expect(mockUtils.show_alert).toHaveBeenCalledWith(jasmine.any(String), 'error');
        });
    });

    describe('isValidRegex()', () => {
        it('should return true for empty value', () => {
            expect(component.isValidRegex('f', '[0-9]+', '')).toBeTrue();
        });

        it('should return true when value matches regex', () => {
            component.formData['phone'] = '12345';
            expect(component.isValidRegex('phone', '^[0-9]+$')).toBeTrue();
        });

        it('should return false when value does not match regex', () => {
            component.formData['phone'] = 'abc';
            expect(component.isValidRegex('phone', '^[0-9]+$')).toBeFalse();
        });
    });

    describe('getIntroClass()', () => {
        it('should return blue class for blue', () => {
            expect(component.getIntroClass('blue')).toContain('blue');
        });

        it('should fall back to gray for unknown color', () => {
            expect(component.getIntroClass('unknown')).toContain('zinc');
        });
    });
});
