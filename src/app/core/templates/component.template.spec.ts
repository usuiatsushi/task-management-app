import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentNameComponent } from './component.template';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ComponentNameComponent', () => {
  let component: ComponentNameComponent;
  let fixture: ComponentFixture<ComponentNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ComponentNameComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.form.get('title')?.value).toBe('');
    expect(component.form.get('description')?.value).toBe('');
  });

  it('should validate form fields', () => {
    const form = component.form;
    expect(form.valid).toBeFalsy();

    form.get('title')?.setValue('テストタイトル');
    form.get('description')?.setValue('テスト説明');
    expect(form.valid).toBeTruthy();
  });

  it('should reset form on cancel', () => {
    const form = component.form;
    form.get('title')?.setValue('テストタイトル');
    form.get('description')?.setValue('テスト説明');

    component.onCancel();

    expect(form.get('title')?.value).toBe('');
    expect(form.get('description')?.value).toBe('');
  });

  it('should submit form when valid', () => {
    const form = component.form;
    const testData = {
      title: 'テストタイトル',
      description: 'テスト説明'
    };

    form.get('title')?.setValue(testData.title);
    form.get('description')?.setValue(testData.description);

    spyOn(console, 'log');
    component.onSubmit();

    expect(console.log).toHaveBeenCalledWith('Form submitted:', testData);
  });
}); 