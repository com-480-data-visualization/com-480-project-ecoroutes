import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesInputComponent } from './routes-input.component';

describe('RoutesInputComponent', () => {
  let component: RoutesInputComponent;
  let fixture: ComponentFixture<RoutesInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesInputComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoutesInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
