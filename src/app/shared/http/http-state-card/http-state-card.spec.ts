import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpStateCard } from './http-state-card';

describe('HttpStateCard', () => {
  let component: HttpStateCard;
  let fixture: ComponentFixture<HttpStateCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpStateCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HttpStateCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
