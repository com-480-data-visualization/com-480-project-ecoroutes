import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRoutesComponent } from './list-routes.component';

describe('ListRoutesComponent', () => {
  let component: ListRoutesComponent;
  let fixture: ComponentFixture<ListRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListRoutesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
