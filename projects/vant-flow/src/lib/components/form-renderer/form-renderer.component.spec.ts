import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VfRenderer } from './form-renderer.component';
import { VfFormContext } from '../../services/form-context';
import { VfUtilityService } from '../../services/app-utility.service';
import { signal } from '@angular/core';

describe('VfRenderer', () => {
    let component: VfRenderer;
    let fixture: ComponentFixture<VfRenderer>;
    let mockFormContext: jasmine.SpyObj<VfFormContext>;
    let mockUtils: jasmine.SpyObj<VfUtilityService>;

    beforeEach(async () => {
        mockFormContext = jasmine.createSpyObj('VfFormContext', [
            'getFieldSignal', 'getSectionSignal', 'set_section_property',
            'initialize', 'execute',
            'trigger', 'triggerChange', 'destroy', 'set_df_property', 'set_button_property'
        ]);

        (mockFormContext as any).valueUpdateSignal = signal(0);
        (mockFormContext as any).isReadOnly = signal(false);
        (mockFormContext as any).dynamicIntro = signal(null);
        (mockFormContext as any).customButtons = signal([]);
        (mockFormContext as any).actionsConfig = signal({ submit: { label: 'Submit', visible: true, type: 'primary' } });
        (mockFormContext as any).metadata = undefined;
        (mockFormContext as any).mediaHandler = undefined;

        mockFormContext.getFieldSignal.and.returnValue(signal(false));
        mockFormContext.getSectionSignal.and.returnValue(signal(false));
        mockFormContext.trigger.and.returnValue(true);
        mockFormContext.execute.and.stub();

        mockUtils = jasmine.createSpyObj('VfUtilityService', [
            'show_alert', 'getDeepValue', 'setDeepValue'
        ]);
        mockUtils.getDeepValue.and.returnValue(undefined);

        await TestBed.configureTestingModule({
            imports: [VfRenderer, HttpClientTestingModule],
        })
            .overrideComponent(VfRenderer, {
                set: {
                    providers: [
                        { provide: VfFormContext, useValue: mockFormContext },
                        { provide: VfUtilityService, useValue: mockUtils }
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(VfRenderer);
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
        component.metadata = { currentUser: { role: 'Manager' } };
        fixture.detectChanges();
        expect(mockFormContext.initialize).toHaveBeenCalledWith(component.document, component.formData, component.metadata);
    });

    it('should trigger refresh script on init', () => {
        fixture.detectChanges();
        expect(mockFormContext.execute).toHaveBeenCalledWith(component.document.client_script || '', 'refresh');
        expect(mockFormContext.trigger).toHaveBeenCalledWith('refresh');
    });

    it('does not execute schema client scripts when runFormScripts is false', () => {
        component.runFormScripts = false;

        fixture.detectChanges();

        expect(mockFormContext.execute).not.toHaveBeenCalled();
        expect(mockFormContext.trigger).toHaveBeenCalledWith('refresh');
    });

    it('should assign mediaHandler to the form context', () => {
        const mediaHandler = jasmine.createSpy('mediaHandler');
        component.mediaHandler = mediaHandler as any;

        fixture.detectChanges();

        expect((mockFormContext as any).mediaHandler).toBe(mediaHandler as any);
    });

    it('should update runtime metadata on input changes after init', () => {
        fixture.detectChanges();

        component.metadata = { featureFlags: { clearanceOverride: true } };
        component.ngOnChanges({
            metadata: {
                currentValue: component.metadata,
                previousValue: undefined,
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect((mockFormContext as any).metadata).toEqual({ featureFlags: { clearanceOverride: true } });
    });

    it('applies host readonly and hidden field overrides on init', () => {
        component.readonlyFields = ['reviewer_notes', 'approve_step'];
        component.hiddenFields = ['internal_comment'];

        fixture.detectChanges();

        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('reviewer_notes', 'read_only', true);
        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('approve_step', 'read_only', true);
        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('internal_comment', 'hidden', true);
    });

    it('updates host field overrides when renderer inputs change', () => {
        component.readonlyFields = ['reviewer_notes'];
        fixture.detectChanges();
        mockFormContext.set_df_property.calls.reset();

        component.readonlyFields = ['finance_notes'];
        component.hiddenFields = ['internal_comment'];
        component.ngOnChanges({
            readonlyFields: {
                currentValue: component.readonlyFields,
                previousValue: ['reviewer_notes'],
                firstChange: false,
                isFirstChange: () => false
            },
            hiddenFields: {
                currentValue: component.hiddenFields,
                previousValue: [],
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('reviewer_notes', 'read_only', false);
        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('finance_notes', 'read_only', true);
        expect(mockFormContext.set_df_property).toHaveBeenCalledWith('internal_comment', 'hidden', true);
    });

    it('applies host action button overrides on init and change', () => {
        component.disabledActionButtons = ['submit'];
        component.hiddenActionButtons = ['approve'];
        fixture.detectChanges();

        expect(mockFormContext.set_button_property).toHaveBeenCalledWith('submit', 'disable_on_readonly', true);
        expect(mockFormContext.set_button_property).toHaveBeenCalledWith('approve', 'visible', false);

        mockFormContext.set_button_property.calls.reset();
        component.hiddenActionButtons = [];
        component.ngOnChanges({
            hiddenActionButtons: {
                currentValue: [],
                previousValue: ['approve'],
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(mockFormContext.set_button_property).toHaveBeenCalledWith('approve', 'visible', true);
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
            component.formAction.subscribe((d: unknown) => emitted = d);

            component.submit();

            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'user.first_name', 'John');
            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'user.details.age', 30);
            expect(mockUtils.setDeepValue).toHaveBeenCalledWith(jasmine.any(Object), 'city', 'Harare');
            expect(emitted.action).toBe('submit');
            expect(emitted.buttonName).toBe('Submit');
            expect(emitted.data).toEqual({
                user: {
                    first_name: 'John',
                    details: { age: 30 }
                },
                city: 'Harare'
            });
            expect(emitted.frm).toBe(mockFormContext as any);
        });
    });

    describe('formAction output', () => {
        it('emits a custom action event and runs the configured runtime action', () => {
            component.document = {
                name: 'Custom Action Form',
                sections: [{
                    id: 's1',
                    columns: [{
                        id: 'c1',
                        fields: [
                            { id: 'f1', fieldtype: 'Data', fieldname: 'status', label: 'Status' }
                        ]
                    }]
                }]
            };
            fixture.detectChanges();

            const runtimeAction = jasmine.createSpy('runtimeAction');
            (mockFormContext as any).actionsConfig.set({
                submit: { label: 'Submit', visible: true, type: 'primary' },
                approve: { label: 'Approve', visible: true, runtimeAction }
            });
            mockUtils.setDeepValue.and.callFake((obj: any, path: string, val: any) => {
                const parts = path.split('.');
                let cur = obj;
                for (let i = 0; i < parts.length - 1; i++) {
                    cur[parts[i]] = cur[parts[i]] || {};
                    cur = cur[parts[i]];
                }
                cur[parts[parts.length - 1]] = val;
            });
            component.formData = { status: 'Pending' };

            let emitted: any;
            component.formAction.subscribe((d: unknown) => emitted = d);

            component.onAction('approve');

            expect(runtimeAction).toHaveBeenCalledWith(mockFormContext as any);
            expect(emitted.action).toBe('approve');
            expect(emitted.buttonName).toBe('Approve');
            expect(emitted.data).toEqual({ status: 'Pending' });
            expect(emitted.rawData).toEqual({ status: 'Pending' });
            expect(emitted.source).toBe('custom');
            expect(emitted.frm).toBe(mockFormContext as any);
        });

        it('skips schema button action scripts when runFormScripts is false', () => {
            fixture.detectChanges();

            (mockFormContext as any).actionsConfig.set({
                submit: { label: 'Submit', visible: true, type: 'primary' },
                approve: { label: 'Approve', visible: true, action: "frm.msgprint('approved')" }
            });

            mockFormContext.execute.calls.reset();
            component.runFormScripts = false;

            component.onAction('approve');

            expect(mockFormContext.execute).not.toHaveBeenCalled();
        });
    });

    it('rebuilds runtime context when runFormScripts changes after init', () => {
        fixture.detectChanges();
        mockFormContext.initialize.calls.reset();
        mockFormContext.execute.calls.reset();
        mockFormContext.trigger.calls.reset();
        mockFormContext.destroy.calls.reset();

        component.runFormScripts = false;
        component.ngOnChanges({
            runFormScripts: {
                currentValue: false,
                previousValue: true,
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(mockFormContext.destroy).toHaveBeenCalled();
        expect(mockFormContext.initialize).toHaveBeenCalledWith(component.document, component.formData, component.metadata);
        expect(mockFormContext.execute).not.toHaveBeenCalled();
        expect(mockFormContext.trigger).toHaveBeenCalledWith('refresh');
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
