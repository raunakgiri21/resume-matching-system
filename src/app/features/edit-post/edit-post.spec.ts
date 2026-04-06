import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditPost } from './edit-post';

describe('EditPost', () => {
  let component: EditPost;
  let fixture: ComponentFixture<EditPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPost],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load post data on init', () => {
    expect(component.isLoadingData).toBe(true);
  });

  it('should validate form fields on submit', () => {
    component.editPostForm.patchValue({
      company_name: '',
      role_title: '',
    });
    expect(component.editPostForm.invalid).toBe(true);
  });
});
