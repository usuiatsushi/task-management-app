import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const mockDialogData = {
    title: '確認',
    message: 'この操作を実行してもよろしいですか？',
    confirmText: '実行',
    cancelText: 'キャンセル'
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        ConfirmDialogComponent,
        MatDialogModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display dialog data correctly', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain(mockDialogData.title);
    expect(compiled.querySelector('p').textContent).toContain(mockDialogData.message);
    expect(compiled.querySelectorAll('button')[0].textContent).toContain(mockDialogData.cancelText);
    expect(compiled.querySelectorAll('button')[1].textContent).toContain(mockDialogData.confirmText);
  });

  it('should close dialog with true when confirm button is clicked', () => {
    component.onConfirm();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when cancel button is clicked', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
}); 