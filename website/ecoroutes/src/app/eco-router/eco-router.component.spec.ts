import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcoRouterComponent } from './eco-router.component';

describe('EcoRouterComponent', () => {
  let component: EcoRouterComponent;
  let fixture: ComponentFixture<EcoRouterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcoRouterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EcoRouterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
