import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty email and name', () => {
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('name')?.value).toBe('');
  });

  it('should mark fields as invalid when empty', () => {
    const emailControl = component.registerForm.get('email');
    const nameControl = component.registerForm.get('name');

    emailControl?.markAsTouched();
    nameControl?.markAsTouched();

    expect(emailControl?.invalid).toBeTruthy();
    expect(nameControl?.invalid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate name minimum length', () => {
    const nameControl = component.registerForm.get('name');

    nameControl?.setValue('J');
    expect(nameControl?.hasError('minlength')).toBeTruthy();

    nameControl?.setValue('John');
    expect(nameControl?.hasError('minlength')).toBeFalsy();
  });
});
