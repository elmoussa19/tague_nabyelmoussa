import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingerFormComponent } from './singer-form.component';

describe('SingerFormComponent', () => {
  let component: SingerFormComponent;
  let fixture: ComponentFixture<SingerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingerFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
