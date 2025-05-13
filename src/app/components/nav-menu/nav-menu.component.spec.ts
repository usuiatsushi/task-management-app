import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavMenuComponent } from './nav-menu.component';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Firestore } from '@angular/fire/firestore';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('NavMenuComponent', () => {
  let component: NavMenuComponent;
  let fixture: ComponentFixture<NavMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMenuComponent, HttpClientTestingModule],
      providers: [
        { provide: AngularFireAuth, useValue: { authState: { subscribe: () => {} } } },
        { provide: 'angularfire2.app.options', useValue: {} },
        { provide: AngularFirestore, useValue: {} },
        { provide: Firestore, useValue: {} },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display menu title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('タスク一覧'); // 例
  });

  it('should have menu items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('a').length).toBeGreaterThan(0);
  });

  it('should have specific menu items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuItems = compiled.querySelectorAll('a');
    
    // 各メニュー項目の存在確認
    expect(compiled.textContent).toContain('タスク一覧');
    expect(compiled.textContent).toContain('新規タスク作成');
    expect(compiled.textContent).toContain('プロジェクト');
    expect(compiled.textContent).toContain('ログアウト');
  });

  it('should have correct navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a[mat-list-item]');
    
    // 各リンクの存在確認
    expect(links.length).toBeGreaterThan(0);
    
    // 各リンクのテキストコンテンツを確認（アイコンを含む）
    const linkTexts = Array.from(links).map(link => link.textContent?.trim());
    expect(linkTexts).toContain('listタスク一覧');
    expect(linkTexts).toContain('add新規タスク作成');
    expect(linkTexts).toContain('folderプロジェクトexpand_less');
    expect(linkTexts).toContain('logoutログアウト');
  });

  it('should handle authentication state', () => {
    // 認証状態の変更をシミュレート
    const authService = TestBed.inject(AngularFireAuth);
    // 認証状態に応じた表示の確認
    // ...
  });

  it('should be responsive', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navList = compiled.querySelector('mat-nav-list');
    expect(navList).toBeTruthy();
    
    if (navList) {
      // スタイルの確認
      const styles = window.getComputedStyle(navList);
      expect(styles.display).toBe('block');
      expect(styles.width).not.toBe('0px');
    }
  });
}); 