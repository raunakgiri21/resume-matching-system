import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetFeedback } from './get-feedback';

describe('GetFeedback', () => {
  let component: GetFeedback;
  let fixture: ComponentFixture<GetFeedback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetFeedback],
    }).compileComponents();

    fixture = TestBed.createComponent(GetFeedback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
