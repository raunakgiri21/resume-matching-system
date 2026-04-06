import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePost } from './create-post';

describe('CreatePost', () => {
  let component: CreatePost;
  let fixture: ComponentFixture<CreatePost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePost],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    expect(component.createPostForm.get('company_name')?.value).toBe('');
    expect(component.createPostForm.get('role_title')?.value).toBe('');
    expect(component.createPostForm.get('job_description')?.value).toBe('');
    expect(component.createPostForm.get('ctc_lpa')?.value).toBe(0);
  });

  it('should mark form as invalid when required fields are empty', () => {
    expect(component.createPostForm.valid).toBeFalsy();
  });

  it('should validate company_name field', () => {
    const field = component.createPostForm.get('company_name');
    field?.setValue('');
    expect(field?.hasError('required')).toBeTruthy();

    field?.setValue('A');
    expect(field?.hasError('minlength')).toBeTruthy();

    field?.setValue('Valid Company');
    expect(field?.valid).toBeTruthy();
  });

  it('should validate ctc_lpa field', () => {
    const field = component.createPostForm.get('ctc_lpa');
    field?.setValue(-1);
    expect(field?.hasError('min')).toBeTruthy();

    field?.setValue(10);
    expect(field?.valid).toBeTruthy();
  });
});
